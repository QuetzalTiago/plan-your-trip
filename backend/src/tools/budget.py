"""Budget estimation tool."""

from __future__ import annotations

from typing import Any

# Average daily costs by budget range (EUR) — rough estimates by region
_DAILY_COSTS = {
    "low": {"food": 25, "transport": 10, "activities": 15},
    "mid": {"food": 50, "transport": 25, "activities": 35},
    "high": {"food": 100, "transport": 50, "activities": 75},
}


def estimate_trip_budget(
    destination: str,
    days: int,
    budget_range: str = "mid",
    travelers: int = 1,
    avg_flight_price: float | None = None,
    avg_hotel_price_per_night: float | None = None,
) -> dict[str, Any]:
    """Estimate total trip budget based on destination, duration, and style."""
    daily = _DAILY_COSTS.get(budget_range, _DAILY_COSTS["mid"])

    flight_total = (avg_flight_price or 300) * travelers
    hotel_total = (avg_hotel_price_per_night or 80) * days
    food_total = daily["food"] * days * travelers
    transport_total = daily["transport"] * days
    activities_total = daily["activities"] * days * travelers

    total = flight_total + hotel_total + food_total + transport_total + activities_total

    return {
        "destination": destination,
        "days": days,
        "travelers": travelers,
        "budget_range": budget_range,
        "breakdown": {
            "flights": round(flight_total, 2),
            "accommodation": round(hotel_total, 2),
            "food": round(food_total, 2),
            "local_transport": round(transport_total, 2),
            "activities": round(activities_total, 2),
        },
        "estimated_total": round(total, 2),
        "currency": "EUR",
        "note": "Estimates based on average costs. Actual prices may vary.",
    }
