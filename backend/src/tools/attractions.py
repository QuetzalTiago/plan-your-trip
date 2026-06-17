"""Attractions and tours tools using Serpapi (Google Maps)."""

from __future__ import annotations

from typing import Any

from serpapi import GoogleSearch

from ..config import settings


def get_attractions(
    latitude: float,
    longitude: float,
    radius: int = 10,
    max_results: int = 10,
) -> dict[str, Any]:
    """Get Points of Interest near coordinates using Google Maps."""
    if not settings.serpapi_api_key:
        return {"error": "SERPAPI_API_KEY not configured", "attractions": []}

    try:
        params = {
            "engine": "google_maps",
            "q": "tourist attractions",
            "ll": f"@{latitude},{longitude},{radius}z",
            "type": "search",
            "api_key": settings.serpapi_api_key,
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        if "error" in results:
            return {"error": results["error"], "attractions": []}

        pois = []
        local_results = results.get("local_results", [])[:max_results]

        for place in local_results:
            gps = place.get("gps_coordinates", {})
            pois.append(
                {
                    "name": place.get("title", ""),
                    "category": place.get("type", ""),
                    "rating": place.get("rating"),
                    "reviews": place.get("reviews", 0),
                    "address": place.get("address", ""),
                    "latitude": gps.get("latitude"),
                    "longitude": gps.get("longitude"),
                    "hours": place.get("hours", ""),
                }
            )

        return {"attractions": pois, "count": len(pois)}

    except Exception as e:
        return {
            "error": f"Serpapi attractions search failed: {str(e)}",
            "attractions": [],
        }


def get_tours_activities(
    latitude: float,
    longitude: float,
    radius: int = 10,
    max_results: int = 10,
) -> dict[str, Any]:
    """Get bookable tours and activities near coordinates."""
    if not settings.serpapi_api_key:
        return {"error": "SERPAPI_API_KEY not configured", "activities": []}

    try:
        params = {
            "engine": "google_maps",
            "q": "tours and activities",
            "ll": f"@{latitude},{longitude},{radius}z",
            "type": "search",
            "api_key": settings.serpapi_api_key,
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        if "error" in results:
            return {"error": results["error"], "activities": []}

        activities = []
        local_results = results.get("local_results", [])[:max_results]

        for place in local_results:
            gps = place.get("gps_coordinates", {})
            activities.append(
                {
                    "name": place.get("title", ""),
                    "description": place.get("description", ""),
                    "rating": place.get("rating"),
                    "reviews": place.get("reviews", 0),
                    "address": place.get("address", ""),
                    "latitude": gps.get("latitude"),
                    "longitude": gps.get("longitude"),
                    "hours": place.get("hours", ""),
                }
            )

        return {"activities": activities, "count": len(activities)}

    except Exception as e:
        return {
            "error": f"Serpapi activities search failed: {str(e)}",
            "activities": [],
        }
