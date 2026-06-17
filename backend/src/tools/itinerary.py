"""Itinerary builder — structures a day-by-day travel plan."""

from __future__ import annotations

import json
from typing import Any


def build_day_itinerary(
    destination: str,
    days: int,
    attractions: list[dict[str, Any]] | None = None,
    activities: list[dict[str, Any]] | None = None,
    trip_style: str = "mixed",
    notes: str = "",
) -> dict[str, Any]:
    """Build a structured day-by-day itinerary skeleton from available data.

    This creates a framework that the Gemini agent will flesh out with
    natural language descriptions and time allocations.
    """
    attractions = attractions or []
    activities = activities or []

    # Distribute attractions and activities across days
    all_items = []
    for a in attractions:
        all_items.append(
            {
                "name": a.get("name", ""),
                "type": "attraction",
                "category": a.get("category", ""),
                "latitude": a.get("latitude"),
                "longitude": a.get("longitude"),
            }
        )
    for a in activities:
        all_items.append(
            {
                "name": a.get("name", ""),
                "type": "activity",
                "description": a.get("description", ""),
                "price": a.get("price"),
                "currency": a.get("currency", "EUR"),
                "duration": a.get("duration"),
                "latitude": a.get("latitude"),
                "longitude": a.get("longitude"),
            }
        )

    # Simple round-robin distribution
    day_plans = []
    for day_num in range(1, days + 1):
        day_items = all_items[day_num - 1 :: days]  # every N-th item

        day_activities = []
        for i, item in enumerate(day_items[:4]):  # max 4 per day
            times = ["09:00", "11:30", "14:00", "16:30"]
            day_activities.append(
                {
                    "time": times[i] if i < len(times) else "",
                    "name": item["name"],
                    "type": item["type"],
                    "location": destination,
                    "notes": item.get("description", ""),
                    "cost_estimate": item.get("price"),
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude"),
                }
            )

        day_plans.append(
            {
                "day": day_num,
                "activities": day_activities,
            }
        )

    return {
        "destination": destination,
        "total_days": days,
        "trip_style": trip_style,
        "day_plans": day_plans,
        "notes": notes,
    }
