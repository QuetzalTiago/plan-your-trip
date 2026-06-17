"""Gemini FunctionDeclaration definitions for all travel tools + tool registry."""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable

from ..exceptions import ToolExecutionError
from ..tools import (
    flights,
    hotels,
    weather,
    attractions,
    events,
    dates,
    budget,
    visa,
    itinerary,
)

logger = logging.getLogger(__name__)

# ─── Tool Declarations (Gemini FunctionDeclaration format) ────────────────────

TOOL_DECLARATIONS: list[dict[str, Any]] = [
    {
        "name": "search_flights",
        "description": "Search for flight offers between two airports on specific dates. Returns prices, airlines, durations, and number of stops.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Origin airport IATA code (e.g., 'LIS' for Lisbon)",
                },
                "destination": {
                    "type": "string",
                    "description": "Destination airport IATA code (e.g., 'NRT' for Tokyo)",
                },
                "departure_date": {
                    "type": "string",
                    "description": "Departure date in YYYY-MM-DD format",
                },
                "return_date": {
                    "type": "string",
                    "description": "Return date in YYYY-MM-DD format. Omit for one-way.",
                },
                "adults": {
                    "type": "integer",
                    "description": "Number of adult travelers. Default 1.",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of results to return. Default 5.",
                },
            },
            "required": ["origin", "destination", "departure_date"],
        },
    },
    {
        "name": "search_cheapest_dates",
        "description": "Find the cheapest travel dates for a route. Useful when the user hasn't decided on exact dates.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "Origin airport IATA code"},
                "destination": {
                    "type": "string",
                    "description": "Destination airport IATA code",
                },
            },
            "required": ["origin", "destination"],
        },
    },
    {
        "name": "search_hotels",
        "description": "Search for hotel availability and prices in a city for specific dates. Use the full city name for best results.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City name (e.g., 'Tokyo', 'Paris', 'New York')",
                },
                "check_in": {
                    "type": "string",
                    "description": "Check-in date YYYY-MM-DD",
                },
                "check_out": {
                    "type": "string",
                    "description": "Check-out date YYYY-MM-DD",
                },
                "adults": {
                    "type": "integer",
                    "description": "Number of adults. Default 1.",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Max results. Default 5.",
                },
            },
            "required": ["city", "check_in", "check_out"],
        },
    },
    {
        "name": "get_hotel_ratings",
        "description": "Get sentiment ratings and reviews summary for specific hotels by their IDs.",
        "parameters": {
            "type": "object",
            "properties": {
                "hotel_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of hotel IDs to get ratings for.",
                },
            },
            "required": ["hotel_ids"],
        },
    },
    {
        "name": "get_weather_forecast",
        "description": "Get weather forecast for a city (up to 16 days ahead). Shows temperature, precipitation, and conditions.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name (e.g., 'Tokyo')"},
                "start_date": {
                    "type": "string",
                    "description": "Start date YYYY-MM-DD (optional, defaults to today)",
                },
                "end_date": {
                    "type": "string",
                    "description": "End date YYYY-MM-DD (optional)",
                },
            },
            "required": ["city"],
        },
    },
    {
        "name": "get_historical_climate",
        "description": "Get average historical weather for a specific month in a city. Useful for choosing the best travel month.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"},
                "month": {"type": "integer", "description": "Month number (1-12)"},
            },
            "required": ["city", "month"],
        },
    },
    {
        "name": "get_attractions",
        "description": "Get popular Points of Interest (museums, landmarks, parks) near coordinates.",
        "parameters": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude of the location",
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude of the location",
                },
                "radius": {
                    "type": "integer",
                    "description": "Search radius in km. Default 10.",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Max results. Default 10.",
                },
            },
            "required": ["latitude", "longitude"],
        },
    },
    {
        "name": "get_tours_activities",
        "description": "Get bookable tours and activities near coordinates, with prices and durations.",
        "parameters": {
            "type": "object",
            "properties": {
                "latitude": {"type": "number", "description": "Latitude"},
                "longitude": {"type": "number", "description": "Longitude"},
                "radius": {
                    "type": "integer",
                    "description": "Search radius in km. Default 10.",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Max results. Default 10.",
                },
            },
            "required": ["latitude", "longitude"],
        },
    },
    {
        "name": "search_local_events",
        "description": "Search for festivals, events, and cultural celebrations in a city during specific dates.",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"},
                "country": {"type": "string", "description": "Country name"},
                "date_from": {
                    "type": "string",
                    "description": "Start date YYYY-MM-DD (optional)",
                },
                "date_to": {
                    "type": "string",
                    "description": "End date YYYY-MM-DD (optional)",
                },
            },
            "required": ["city", "country"],
        },
    },
    {
        "name": "get_best_travel_dates",
        "description": "Analyze flight prices and historical weather to recommend the best months to visit a destination.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "Origin airport IATA code"},
                "destination_city": {
                    "type": "string",
                    "description": "Destination city name",
                },
                "destination_iata": {
                    "type": "string",
                    "description": "Destination airport IATA code",
                },
                "month_start": {
                    "type": "integer",
                    "description": "Start of month range (1-12). Default 1.",
                },
                "month_end": {
                    "type": "integer",
                    "description": "End of month range (1-12). Default 12.",
                },
            },
            "required": ["origin", "destination_city", "destination_iata"],
        },
    },
    {
        "name": "estimate_trip_budget",
        "description": "Estimate total trip cost including flights, hotels, food, transport, and activities.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "Destination city"},
                "days": {"type": "integer", "description": "Number of days"},
                "budget_range": {
                    "type": "string",
                    "enum": ["low", "mid", "high"],
                    "description": "Budget level",
                },
                "travelers": {
                    "type": "integer",
                    "description": "Number of travelers. Default 1.",
                },
                "avg_flight_price": {
                    "type": "number",
                    "description": "Average flight price per person (optional)",
                },
                "avg_hotel_price_per_night": {
                    "type": "number",
                    "description": "Average hotel price per night (optional)",
                },
            },
            "required": ["destination", "days"],
        },
    },
    {
        "name": "get_visa_requirements",
        "description": "Get visa requirements for traveling from one country to another.",
        "parameters": {
            "type": "object",
            "properties": {
                "passport_country": {
                    "type": "string",
                    "description": "Country of passport holder (e.g., 'Portugal')",
                },
                "destination_country": {
                    "type": "string",
                    "description": "Destination country (e.g., 'Japan')",
                },
            },
            "required": ["passport_country", "destination_country"],
        },
    },
    {
        "name": "build_day_itinerary",
        "description": "Build a structured day-by-day itinerary from attractions and activities data.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "Destination city"},
                "days": {"type": "integer", "description": "Number of days"},
                "attractions": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "List of attraction objects from get_attractions",
                },
                "activities": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "List of activity objects from get_tours_activities",
                },
                "trip_style": {
                    "type": "string",
                    "enum": ["adventure", "relaxation", "cultural", "mixed"],
                },
                "notes": {
                    "type": "string",
                    "description": "Additional notes or preferences",
                },
            },
            "required": ["destination", "days"],
        },
    },
]


# ─── Tool Registry — maps function names to callables ─────────────────────────

TOOL_REGISTRY: dict[str, Callable[..., Any]] = {
    "search_flights": flights.search_flights,
    "search_cheapest_dates": flights.search_cheapest_dates,
    "search_hotels": hotels.search_hotels,
    "get_hotel_ratings": hotels.get_hotel_ratings,
    "get_weather_forecast": weather.get_weather_forecast,
    "get_historical_climate": weather.get_historical_climate,
    "get_attractions": attractions.get_attractions,
    "get_tours_activities": attractions.get_tours_activities,
    "search_local_events": events.search_local_events,
    "get_best_travel_dates": dates.get_best_travel_dates,
    "estimate_trip_budget": budget.estimate_trip_budget,
    "get_visa_requirements": visa.get_visa_requirements,
    "build_day_itinerary": itinerary.build_day_itinerary,
}


async def execute_tool_async(name: str, args: dict[str, Any]) -> dict[str, Any]:
    """
    Execute a tool asynchronously.
    If the tool is async, call it directly. Otherwise, run in thread pool.
    """
    logger.debug(f"Executing tool: {name}")

    fn = TOOL_REGISTRY.get(name)
    if not fn:
        error_msg = f"Unknown tool: {name}"
        logger.error(error_msg)
        return {"error": error_msg}

    try:
        # Check if function is a coroutine function
        if asyncio.iscoroutinefunction(fn):
            # Call async function directly
            result = await fn(**args)
        else:
            # Run sync function in thread pool to avoid blocking async loop
            result = await asyncio.to_thread(fn, **args)

        # Ensure result is a dict
        if not isinstance(result, dict):
            result = {"result": result}

        # Log errors if present
        if "error" in result:
            logger.warning(f"Tool {name} returned error: {result['error']}")
        else:
            logger.debug(f"Tool {name} completed successfully")

        return result
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Tool {name} exception: {error_msg}", exc_info=True)
        return {"error": error_msg}
