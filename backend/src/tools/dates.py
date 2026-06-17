"""Best travel dates — composite tool combining flights, weather, and events."""

from __future__ import annotations

from typing import Any

from .flights import search_cheapest_dates
from .weather import get_historical_climate


def get_best_travel_dates(
    origin: str,
    destination_city: str,
    destination_iata: str,
    month_start: int = 1,
    month_end: int = 12,
) -> dict[str, Any]:
    """Cross-reference flight prices and weather to find optimal travel dates."""

    # Get cheapest flight dates
    flight_data = search_cheapest_dates(origin, destination_iata)

    # Get climate data for requested months
    climate_data = []
    for month in range(month_start, month_end + 1):
        climate = get_historical_climate(destination_city, month)
        if "error" not in climate:
            climate_data.append(climate)

    # Score each month: lower price + better weather = higher score
    month_scores = []
    for climate in climate_data:
        month = climate["month"]
        avg_temp = climate.get("avg_temp_max", 20)
        precip = climate.get("avg_daily_precipitation_mm", 5)

        # Temperature comfort score (20-28°C is ideal)
        if avg_temp is None:
            temp_score = 50
        elif 20 <= avg_temp <= 28:
            temp_score = 100
        elif 15 <= avg_temp < 20 or 28 < avg_temp <= 35:
            temp_score = 70
        else:
            temp_score = 40

        # Rain score (less is better)
        rain_score = max(0, 100 - (precip or 0) * 10)

        month_scores.append(
            {
                "month": month,
                "temp_score": temp_score,
                "rain_score": rain_score,
                "combined_score": (temp_score + rain_score) / 2,
                "avg_temp_max": avg_temp,
                "avg_precipitation_mm": precip,
            }
        )

    # Sort by score
    month_scores.sort(key=lambda x: x["combined_score"], reverse=True)

    return {
        "best_months": month_scores[:3],
        "all_months": month_scores,
        "cheapest_flight_dates": flight_data.get("cheapest_dates", [])[:5],
        "destination": destination_city,
    }
