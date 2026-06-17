"""Trip CRUD API routes."""

from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass

from fastapi import APIRouter, Depends, HTTPException

from ..auth import get_current_user_id
from ..config import settings
from .. import db
from ..types import (
    CreateTripRequest,
    TripResponse,
    TripListItem,
    TripItem,
)


@dataclass
class UpdateTripRequest:
    status: str


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("", status_code=201)
async def create_trip(
    body: CreateTripRequest,
    user_id: str = Depends(get_current_user_id),
) -> TripResponse:
    """Create a new trip for the authenticated user."""
    trip_id = str(uuid.uuid4())
    now = int(time.time() * 1000)
    title = f"Trip to {body.destination_city}"

    item = TripItem(
        user_id=user_id,
        trip_id=trip_id,
        title=title,
        destination_city=body.destination_city,
        destination_country=body.destination_country,
        destination_iata=body.destination_iata,
        origin_city=body.origin_city,
        origin_iata=body.origin_iata,
        date_from=body.date_from,
        date_to=body.date_to,
        travelers_count=body.travelers_count,
        budget_range=body.budget_range.value,
        trip_style=body.trip_style.value,
        status="planning",
        created_at=now,
        updated_at=now,
    )

    db.put_trip(item)
    logger.info(f"Created trip {trip_id} for user {user_id}")

    return TripResponse(
        id=trip_id,
        title=title,
        destination_city=body.destination_city,
        destination_country=body.destination_country,
        destination_iata=body.destination_iata,
        origin_city=body.origin_city,
        origin_iata=body.origin_iata,
        date_from=body.date_from,
        date_to=body.date_to,
        travelers_count=body.travelers_count,
        budget_range=body.budget_range.value,
        trip_style=body.trip_style.value,
        status="planning",
        created_at=now,
        updated_at=now,
    )


@router.get("")
async def list_trips(
    user_id: str = Depends(get_current_user_id),
) -> list[TripListItem]:
    items = db.list_trips(user_id)
    return [
        TripListItem(
            id=t.trip_id,
            title=t.title,
            destination_city=t.destination_city,
            destination_country=t.destination_country,
            status=t.status,
            created_at=t.created_at,
        )
        for t in items
    ]


@router.get("/{trip_id}")
async def get_trip(
    trip_id: str,
    user_id: str = Depends(get_current_user_id),
) -> TripResponse:
    item = db.get_trip(user_id, trip_id)
    if not item:
        raise HTTPException(status_code=404, detail="Trip not found")

    return TripResponse(
        id=item.trip_id,
        title=item.title,
        destination_city=item.destination_city,
        destination_country=item.destination_country,
        destination_iata=item.destination_iata,
        origin_city=item.origin_city,
        origin_iata=item.origin_iata,
        date_from=item.date_from,
        date_to=item.date_to,
        travelers_count=item.travelers_count,
        budget_range=item.budget_range,
        trip_style=item.trip_style,
        status=item.status,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.patch("/{trip_id}")
async def update_trip(
    trip_id: str,
    body: UpdateTripRequest,
    user_id: str = Depends(get_current_user_id),
) -> TripResponse:
    """Update trip status."""
    item = db.get_trip(user_id, trip_id)
    if not item:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Update status using dedicated function
    db.update_trip_status(user_id, trip_id, body.status)

    # Fetch updated item
    item = db.get_trip(user_id, trip_id)
    if not item:
        raise HTTPException(status_code=500, detail="Failed to fetch updated trip")

    return TripResponse(
        id=item.trip_id,
        title=item.title,
        destination_city=item.destination_city,
        destination_country=item.destination_country,
        destination_iata=item.destination_iata,
        origin_city=item.origin_city,
        origin_iata=item.origin_iata,
        date_from=item.date_from,
        date_to=item.date_to,
        travelers_count=item.travelers_count,
        budget_range=item.budget_range,
        trip_style=item.trip_style,
        status=item.status,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(
    trip_id: str,
    user_id: str = Depends(get_current_user_id),
) -> None:
    db.delete_trip_and_children(user_id, trip_id)


@router.get("/{trip_id}/events")
async def get_trip_events(
    trip_id: str,
    user_id: str = Depends(get_current_user_id),
) -> list[dict]:
    """Get all tool execution results for a trip."""
    import json

    # Verify user owns the trip
    item = db.get_trip(user_id, trip_id)
    if not item:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get all messages and filter for tool_call and tool_result
    messages = db.get_messages(trip_id, limit=1000)

    # Separate tool calls and results
    tool_calls = {msg.message_id: msg for msg in messages if msg.role == "tool_call"}
    tool_results = [msg for msg in messages if msg.role == "tool_result"]

    # Transform to frontend format
    events = []
    for result_msg in tool_results:
        try:
            # Parse result content
            result_data = (
                json.loads(result_msg.content)
                if isinstance(result_msg.content, str)
                else result_msg.content
            )

            # Try to find matching tool call to get args
            args = {}
            # Look for tool call messages close in time with same tool_name
            for call_msg in tool_calls.values():
                if (
                    call_msg.tool_name == result_msg.tool_name
                    and abs(call_msg.created_at - result_msg.created_at) < 60000
                ):  # Within 60s
                    try:
                        call_data = (
                            json.loads(call_msg.content)
                            if isinstance(call_msg.content, str)
                            else call_msg.content
                        )
                        args = call_data.get("args", {})
                        break
                    except (json.JSONDecodeError, AttributeError):
                        pass

            events.append(
                {
                    "id": result_msg.message_id,
                    "timestamp": result_msg.created_at,
                    "tool": result_msg.tool_name or "unknown",
                    "args": args,
                    "result": result_data,
                    "duration": 0,  # Duration not stored separately
                }
            )
        except (json.JSONDecodeError, AttributeError) as e:
            logger.warning(
                f"Failed to parse tool result JSON for message {result_msg.message_id}: {e}"
            )
            continue

    return events
