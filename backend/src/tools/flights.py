"""Flight search tools using Serpapi (Google Flights)."""

from __future__ import annotations

import asyncio
from typing import Any

from serpapi import GoogleSearch

from ..config import settings
from ..exceptions import ExternalAPIError


async def _call_serpapi_with_retry(
    params: dict[str, Any], max_retries: int = 3
) -> dict:
    """Call Serpapi with exponential backoff retry logic (async)."""
    last_error = None

    for attempt in range(max_retries):
        try:
            # Run sync API call in thread pool
            search = GoogleSearch(params)
            results = await asyncio.to_thread(search.get_dict)

            if "error" in results:
                raise ExternalAPIError("Serpapi", results["error"])

            return results
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                # Exponential backoff: 1s, 2s, 4s
                sleep_time = 2**attempt
                await asyncio.sleep(sleep_time)
            else:
                # Last attempt failed
                raise ExternalAPIError("Serpapi", str(last_error))

    # Should never reach here
    raise ExternalAPIError("Serpapi", str(last_error))


async def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str | None = None,
    adults: int = 1,
    max_results: int = 5,
) -> dict[str, Any]:
    """Search flight offers from Google Flights via Serpapi."""
    if not settings.serpapi_api_key:
        return {"error": "SERPAPI_API_KEY not configured", "flights": []}

    try:
        # Build Serpapi params
        params = {
            "engine": "google_flights",
            "departure_id": origin.upper(),
            "arrival_id": destination.upper(),
            "outbound_date": departure_date,
            "adults": adults,
            "currency": "EUR",
            "hl": "en",
            "gl": "us",
            "api_key": settings.serpapi_api_key,
        }

        if return_date:
            params["return_date"] = return_date
            params["type"] = "1"  # Round trip
        else:
            params["type"] = "2"  # One way

        results = await _call_serpapi_with_retry(params)

        # Parse flight results
        offers = []
        best_flights = results.get("best_flights", [])
        other_flights = results.get("other_flights", [])
        all_flights = (best_flights + other_flights)[:max_results]

        for flight in all_flights:
            flights_list = flight.get("flights", [])
            first_flight = flights_list[0] if flights_list else {}
            last_flight = flights_list[-1] if flights_list else {}

            offers.append(
                {
                    "airline": first_flight.get("airline", ""),
                    "departure": first_flight.get("departure_airport", {}).get(
                        "time", ""
                    ),
                    "arrival": last_flight.get("arrival_airport", {}).get("time", ""),
                    "duration": flight.get("total_duration", 0),
                    "stops": len(flights_list) - 1,
                    "price": flight.get("price", 0),
                    "currency": "EUR",
                    "carbon_emissions": flight.get("carbon_emissions", {}),
                }
            )

        return {"flights": offers, "count": len(offers)}

    except ExternalAPIError as e:
        return {"error": str(e), "flights": []}
    except Exception as e:
        return {
            "error": f"Flight search failed: {type(e).__name__}: {str(e)}",
            "flights": [],
        }


async def search_cheapest_dates(
    origin: str,
    destination: str,
) -> dict[str, Any]:
    """Find cheapest travel dates for a route using price graph."""
    if not settings.serpapi_api_key:
        return {"error": "SERPAPI_API_KEY not configured", "dates": []}

    try:
        params = {
            "engine": "google_flights",
            "departure_id": origin.upper(),
            "arrival_id": destination.upper(),
            "currency": "EUR",
            "hl": "en",
            "api_key": settings.serpapi_api_key,
        }

        results = await _call_serpapi_with_retry(params)

        # Parse price graph
        dates = []
        price_graph = results.get("price_graph", [])

        for item in price_graph[:10]:
            dates.append(
                {
                    "departure_date": item.get("date", ""),
                    "price": item.get("price", 0),
                    "currency": "EUR",
                }
            )

        return {"cheapest_dates": dates, "count": len(dates)}

    except ExternalAPIError as e:
        return {"error": str(e), "cheapest_dates": []}
    except Exception as e:
        return {
            "error": f"Date search failed: {type(e).__name__}: {str(e)}",
            "cheapest_dates": [],
        }
