"""Chat API — agentic conversation endpoint with SSE streaming."""

from __future__ import annotations

import json
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..auth import get_current_user_id
from .. import db
from ..exceptions import DatabaseError, AIAPIError
from ..types import ChatRequest, MessageResponse
from ..agent.loop import run_agent_loop

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trips", tags=["chat"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/{trip_id}/chat")
@limiter.limit("20/minute")  # Stricter limit for expensive AI operations
async def chat(
    request: Request,
    trip_id: str,
    body: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Send a message to the travel agent and receive SSE-streamed response."""
    logger.info(f"Chat request for trip {trip_id}")

    try:
        trip = db.get_trip(user_id, trip_id)
    except DatabaseError as e:
        logger.error(f"Database error fetching trip: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    async def event_generator():
        """Generate SSE stream from agent loop."""
        try:
            chunk_count = 0
            last_event_time = time.time()

            async for chunk in run_agent_loop(trip, body.message, user_id):
                chunk_count += 1

                # Check if chunk is structured JSON (debug events, widgets, etc.)
                if chunk.strip().startswith("{"):
                    try:
                        parsed = json.loads(chunk.strip())
                        # Structured event - pass through
                        if "type" in parsed:
                            yield f"data: {chunk}\n\n"
                            continue
                        # Widget data
                        elif "widget_type" in parsed:
                            structured = {"type": "widget", "data": parsed}
                            yield f"data: {json.dumps(structured)}\n\n"
                            continue
                        # Tool call data
                        elif "name" in parsed and "args" in parsed:
                            structured = {"type": "tool_call", "data": parsed}
                            yield f"data: {json.dumps(structured)}\n\n"
                            continue
                    except json.JSONDecodeError:
                        pass  # Not JSON, treat as text

                # Plain text chunk
                structured = {"type": "text", "content": chunk}
                yield f"data: {json.dumps(structured)}\n\n"

            logger.debug(f"Streamed {chunk_count} chunks for trip {trip_id}")
            yield "data: [DONE]\n\n"
        except (AIAPIError, DatabaseError) as e:
            logger.error(f"Agent error: {e}")
            yield f'data: {{"type": "error", "message": "{str(e)}"}}\n\n'
        except Exception as e:
            logger.error(f"Unexpected error in event generator: {e}", exc_info=True)
            yield f'data: {{"type": "error", "message": "An unexpected error occurred"}}\n\n'

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/{trip_id}/messages")
async def get_messages(
    trip_id: str,
    after: int = 0,
    user_id: str = Depends(get_current_user_id),
) -> list[MessageResponse]:
    """Get chat messages for a trip, optionally filtered by timestamp."""
    # Verify trip ownership
    trip = db.get_trip(user_id, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    messages = db.get_messages(trip_id, after=after)
    return [
        MessageResponse(
            id=m.message_id,
            trip_id=m.trip_id,
            role=m.role,
            content=m.content,
            tool_name=m.tool_name,
            created_at=m.created_at,
        )
        for m in messages
    ]
