"""Gemini agentic loop — handles function calling, tool execution, and multi-turn conversations."""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from typing import Any, AsyncGenerator

from google import genai
from google.genai import types

from ..config import settings
from ..exceptions import AIAPIError, DatabaseError
from ..types import MessageItem, TripItem
from .. import db
from .prompts import TRAVEL_AGENT_SYSTEM, MOCK_RESPONSE
from .tools import TOOL_DECLARATIONS, execute_tool_async

logger = logging.getLogger(__name__)


def _get_tool_start_message(tool_name: str) -> str:
    """Return a subtle message when a tool begins execution."""
    messages = {
        "search_flights": "\n\n_Searching for flights..._\n\n",
        "search_cheapest_dates": "\n\n_Finding cheapest dates..._\n\n",
        "search_hotels": "\n\n_Finding hotels..._\n\n",
        "get_hotel_ratings": "\n\n_Getting hotel ratings..._\n\n",
        "get_weather_forecast": "\n\n_Checking weather forecast..._\n\n",
        "get_historical_climate": "\n\n_Checking historical climate..._\n\n",
        "get_attractions": "\n\n_Discovering attractions..._\n\n",
        "get_tours_activities": "\n\n_Finding activities..._\n\n",
        "search_local_events": "\n\n_Searching local events..._\n\n",
        "get_best_travel_dates": "\n\n_Analyzing best travel dates..._\n\n",
        "estimate_trip_budget": "\n\n_Calculating budget..._\n\n",
        "get_visa_requirements": "\n\n_Checking visa requirements..._\n\n",
        "build_day_itinerary": "\n\n_Creating itinerary..._\n\n",
    }
    return messages.get(tool_name, f"\n\n_Running {tool_name}..._\n\n")


def _get_client() -> genai.Client:
    """Create Gemini API client."""
    return genai.Client(api_key=settings.gemini_api_key)


def _build_trip_context(trip: TripItem) -> str:
    """Build a context string from trip metadata."""
    parts = [f"Destination: {trip.destination_city}, {trip.destination_country}"]
    if trip.origin_city:
        parts.append(f"Origin: {trip.origin_city}")
    if trip.destination_iata:
        parts.append(f"Destination airport: {trip.destination_iata}")
    if trip.origin_iata:
        parts.append(f"Origin airport: {trip.origin_iata}")
    if trip.date_from:
        parts.append(f"Travel dates: {trip.date_from} to {trip.date_to or 'TBD'}")
    parts.append(f"Travelers: {trip.travelers_count}")
    parts.append(f"Budget: {trip.budget_range}")
    parts.append(f"Style: {trip.trip_style}")
    return "\n".join(parts)


def _build_gemini_history(
    trip: TripItem, messages: list[MessageItem]
) -> list[types.Content]:
    """Convert stored messages to Gemini conversation history."""
    contents: list[types.Content] = []

    if not messages:
        return contents

    for msg in messages:
        if msg.role == "user":
            contents.append(
                types.Content(role="user", parts=[types.Part(text=msg.content)])
            )
        elif msg.role == "assistant":
            contents.append(
                types.Content(role="model", parts=[types.Part(text=msg.content)])
            )

    return contents


async def run_agent_loop(
    trip: TripItem,
    user_message: str,
    user_id: str,
) -> AsyncGenerator[str, None]:
    """Run the agentic loop: send to Gemini, handle tool calls, stream response.

    Yields text chunks for SSE streaming.
    Tools run in-process using asyncio.gather for parallel execution.
    """
    request_timestamp = int(time.time() * 1000)

    if settings.mock_ai:
        logger.info("MOCK_AI enabled, returning mock response")
        yield MOCK_RESPONSE
        return

    # Initialize Gemini client
    try:
        client = _get_client()
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}", exc_info=True)
        raise AIAPIError(f"Failed to initialize AI client: {e}")

    # Build trip context
    trip_context = _build_trip_context(trip)

    # Load conversation history (last 100 messages for context window management)
    try:
        existing_messages = db.get_messages(trip.trip_id, limit=100)
        history = _build_gemini_history(trip, existing_messages)
        logger.debug(
            f"Loaded {len(existing_messages)} messages for trip {trip.trip_id}"
        )
    except DatabaseError:
        logger.warning("Failed to load conversation history, continuing without it")
        history = []

    # Save user message to DB
    user_msg = MessageItem(
        trip_id=trip.trip_id,
        message_id=str(uuid.uuid4()),
        role="user",
        content=user_message,
        created_at=request_timestamp,
    )
    try:
        db.put_message(user_msg)
    except DatabaseError as e:
        logger.warning(f"Failed to save user message: {e}")

    # Build contents for Gemini
    system_instruction = f"{TRAVEL_AGENT_SYSTEM}\n\nCURRENT TRIP:\n{trip_context}"
    contents = history + [
        types.Content(role="user", parts=[types.Part(text=user_message)])
    ]

    tools = [types.Tool(function_declarations=TOOL_DECLARATIONS)]
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=tools,
        temperature=0.7,
        max_output_tokens=8192,
    )

    # Agentic loop — keep calling Gemini until we get a text response
    max_iterations = 10
    for iteration in range(max_iterations):
        logger.debug(f"Agent loop iteration {iteration + 1}/{max_iterations}")

        # Call Gemini
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=config,
            )
        except Exception as e:
            logger.error(f"Gemini API call failed: {type(e).__name__}: {e}")
            raise AIAPIError(f"AI API error: {e}")

        # Parse response
        candidate = response.candidates[0] if response.candidates else None
        if not candidate or not candidate.content or not candidate.content.parts:
            yield "I'm sorry, I couldn't generate a response. Please try again."
            return

        # Check if there are function calls
        function_calls = [
            part for part in candidate.content.parts if part.function_call is not None
        ]

        if not function_calls:
            # Pure text response — stream it
            full_text = ""
            for part in candidate.content.parts:
                if part.text:
                    full_text += part.text
                    yield part.text

            # Save assistant message
            assistant_msg = MessageItem(
                trip_id=trip.trip_id,
                message_id=str(uuid.uuid4()),
                role="assistant",
                content=full_text.strip(),
                created_at=int(time.time() * 1000),
            )
            try:
                db.put_message(assistant_msg)
            except DatabaseError as e:
                logger.warning(f"Failed to save assistant message: {e}")
            return

        # Handle function calls - Execute tools in parallel
        logger.info(f"Executing {len(function_calls)} tool(s) in parallel")

        # Append the model's response to contents
        contents.append(candidate.content)

        # Collect all function calls from the response
        tool_calls = []
        for part in candidate.content.parts:
            if part.function_call:
                fc = part.function_call
                tool_name = fc.name
                tool_args = dict(fc.args) if fc.args else {}
                tool_calls.append(
                    {
                        "name": tool_name,
                        "args": tool_args,
                        "function_call": fc,
                    }
                )

        if not tool_calls:
            continue

        # Announce all tools starting and save tool call messages
        tool_call_messages = []
        for tc in tool_calls:
            logger.info(f"Starting tool: {tc['name']} with args: {tc['args']}")
            # Yield tool start message
            start_msg = _get_tool_start_message(tc["name"])
            yield start_msg

            # Save tool call message
            msg_timestamp = int(time.time() * 1000)
            tool_call_msg = MessageItem(
                trip_id=trip.trip_id,
                message_id=str(uuid.uuid4()),
                role="tool_call",
                content=json.dumps({"name": tc["name"], "args": tc["args"]}),
                tool_name=tc["name"],
                created_at=msg_timestamp,
            )
            tool_call_messages.append(tool_call_msg)

        # Save all tool call messages in batch
        try:
            db.put_messages_batch(tool_call_messages)
        except DatabaseError as e:
            logger.warning(f"Failed to save tool call messages: {e}")

        # Execute all tools in parallel with keep-alive heartbeats
        async def execute_with_timing(tc):
            start = time.time()
            result = await execute_tool_async(tc["name"], tc["args"])
            duration_ms = int((time.time() - start) * 1000)
            return {
                "tool_call": tc,
                "result": result,
                "duration_ms": duration_ms,
            }

        # Create tasks for all tool executions
        tasks = [asyncio.create_task(execute_with_timing(tc)) for tc in tool_calls]

        # Wait for tasks with periodic heartbeats
        results = []
        pending = set(tasks)
        last_heartbeat = time.time()

        while pending:
            # Wait up to 15 seconds for any task to complete
            done, pending = await asyncio.wait(
                pending, timeout=15.0, return_when=asyncio.FIRST_COMPLETED
            )

            # Collect completed results
            for task in done:
                try:
                    results.append(task.result())
                except Exception as e:
                    results.append(e)

            # Send keep-alive heartbeat if no tasks completed and we're still waiting
            if not done and pending:
                current_time = time.time()
                if current_time - last_heartbeat >= 15:
                    # Send SSE comment as keep-alive (clients ignore comments)
                    yield ": keepalive\n\n"
                    last_heartbeat = current_time
                    logger.debug("Sent keep-alive heartbeat")

        # Process results and build function response parts
        function_response_parts: list[types.Part] = []
        tool_result_messages = []

        for idx, outcome in enumerate(results):
            if isinstance(outcome, Exception):
                # Handle execution exception
                tool_name = tool_calls[idx]["name"]
                error_msg = f"{type(outcome).__name__}: {str(outcome)}"
                logger.error(f"Tool {tool_name} exception: {error_msg}")
                yield f"❌ _{tool_name} failed: {error_msg}_\n\n"

                result = {"error": error_msg}
                fc = tool_calls[idx]["function_call"]
                duration_ms = 0
            else:
                # Tool executed successfully
                tool_name = outcome["tool_call"]["name"]
                result = outcome["result"]
                duration_ms = outcome["duration_ms"]
                fc = outcome["tool_call"]["function_call"]

                # Check if tool returned an error
                if isinstance(result, dict) and "error" in result:
                    error_msg = result["error"]
                    logger.error(f"Tool {tool_name} failed: {error_msg}")
                    yield f"❌ _{tool_name} failed: {error_msg}_\n\n"
                else:
                    logger.info(f"Tool {tool_name} completed in {duration_ms}ms")

                    # Check if tool returned a widget (map, chart, etc.)
                    if isinstance(result, dict) and result.get("widget_type"):
                        widget_type = result.get("widget_type")
                        logger.debug(f"Tool returned {widget_type} widget")

                        # Yield widget data as assistant message
                        widget_timestamp = int(time.time() * 1000)
                        widget_msg = MessageItem(
                            trip_id=trip.trip_id,
                            message_id=str(uuid.uuid4()),
                            role="assistant",
                            content=json.dumps(result),
                            created_at=widget_timestamp,
                        )
                        try:
                            db.put_message(widget_msg)
                        except DatabaseError as e:
                            logger.warning(f"Failed to save widget message: {e}")
                        yield f"\n\n{json.dumps(result)}\n\n"

                    # Yield debug event for frontend visualization
                    debug_event = {
                        "type": "debug",
                        "tool": tool_name,
                        "args": outcome["tool_call"]["args"],
                        "result": result,
                        "timestamp": int(time.time() * 1000),
                        "duration": duration_ms,
                    }
                    yield json.dumps(debug_event)

            # Save tool result message with explicit link to tool call
            result_timestamp = int(time.time() * 1000)
            tool_result_msg = MessageItem(
                trip_id=trip.trip_id,
                message_id=str(uuid.uuid4()),
                role="tool_result",
                content=json.dumps(result),
                tool_name=tool_name,
                tool_call_id=tool_call_messages[idx].message_id,
                created_at=result_timestamp,
            )
            tool_result_messages.append(tool_result_msg)

            # Build function response part for Gemini
            fn_response = types.Part.from_function_response(
                name=tool_name,
                response={"result": result},
            )
            if hasattr(fc, "id") and fc.id:
                fn_response = types.Part.from_function_response(
                    name=tool_name,
                    response={"result": result},
                    id=fc.id,
                )
            function_response_parts.append(fn_response)

        # Save all tool result messages in batch
        try:
            db.put_messages_batch(tool_result_messages)
        except DatabaseError as e:
            logger.warning(f"Failed to save tool result messages: {e}")

        # Send function results back to Gemini
        contents.append(types.Content(role="user", parts=function_response_parts))
        # Continue to next iteration to get Gemini's text response

    # If we hit max iterations, return fallback message
    logger.warning("Hit max iterations without final text response")
    yield "\n\nI've gathered the information above. Let me know if you need anything else!"
