"""Hotel search tools using Serpapi (Google Hotels)."""

from __future__ import annotations

from typing import Any

from serpapi import GoogleSearch

from ..config import settings


def search_hotels(
    city: str,
    check_in: str,
    check_out: str,
    adults: int = 1,
    max_results: int = 5,
) -> dict[str, Any]:
    """Search hotel offers via Google Hotels."""
    if not settings.serpapi_api_key:
        return {"error": "SERPAPI_API_KEY not configured", "hotels": []}

    try:
        # Serpapi Google Hotels requires city name
        params = {
            "engine": "google_hotels",
            "q": city,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "adults": adults,
            "currency": "EUR",
            "gl": "us",
            "hl": "en",
            "api_key": settings.serpapi_api_key,
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        if "error" in results:
            return {"error": results["error"], "hotels": []}

        # Parse hotel results
        hotels = []
        properties = results.get("properties", [])[:max_results]

        for prop in properties:
            hotels.append(
                {
                    "name": prop.get("name", ""),
                    "hotel_id": prop.get("property_token", ""),
                    "rating": prop.get("overall_rating"),
                    "reviews": prop.get("reviews", 0),
                    "price_per_night": prop.get("rate_per_night", {}).get("lowest"),
                    "currency": "EUR",
                    "description": prop.get("description", ""),
                    "amenities": prop.get("amenities", []),
                    "type": prop.get("type", ""),
                }
            )

        return {"hotels": hotels, "count": len(hotels)}

    except Exception as e:
        return {"error": f"Serpapi hotel search failed: {str(e)}", "hotels": []}


def get_hotel_ratings(hotel_ids: list[str]) -> dict[str, Any]:
    """Get hotel ratings - not directly supported by Serpapi, return placeholder."""
    # Google Hotels ratings are included in search results
    return {
        "ratings": [],
        "message": "Hotel ratings are included in search_hotels results",
    }
