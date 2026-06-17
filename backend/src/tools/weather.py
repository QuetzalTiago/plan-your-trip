"""Weather tools using Open-Meteo API (free, no API key)."""

from __future__ import annotations

from typing import Any

import httpx

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"


def _geocode_sync(city: str) -> tuple[float, float] | None:
    with httpx.Client() as client:
        resp = client.get(GEOCODE_URL, params={"name": city, "count": 1})
        data = resp.json()
        results = data.get("results", [])
        if results:
            return results[0]["latitude"], results[0]["longitude"]
    return None


def get_weather_forecast(
    city: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """Get weather forecast for a city (up to 16 days ahead)."""
    coords = _geocode_sync(city)
    if not coords:
        return {"error": f"Could not find coordinates for {city}"}

    lat, lon = coords
    params: dict[str, Any] = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
        "timezone": "auto",
    }
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date

    with httpx.Client() as client:
        resp = client.get(FORECAST_URL, params=params)
        data = resp.json()

    daily = data.get("daily", {})
    dates = daily.get("time", [])
    forecasts = []
    for i, date in enumerate(dates):
        forecasts.append(
            {
                "date": date,
                "temp_max": daily.get("temperature_2m_max", [None])[i],
                "temp_min": daily.get("temperature_2m_min", [None])[i],
                "precipitation_mm": daily.get("precipitation_sum", [None])[i],
                "weather_code": daily.get("weathercode", [None])[i],
            }
        )

    return {"city": city, "forecasts": forecasts}


def get_historical_climate(
    city: str,
    month: int,
) -> dict[str, Any]:
    """Get average historical weather for a month (last 5 years)."""
    coords = _geocode_sync(city)
    if not coords:
        return {"error": f"Could not find coordinates for {city}"}

    lat, lon = coords
    import datetime

    current_year = datetime.date.today().year
    all_temps_max = []
    all_temps_min = []
    all_precip = []

    with httpx.Client() as client:
        for year in range(current_year - 5, current_year):
            start = f"{year}-{month:02d}-01"
            # Last day of month
            if month == 12:
                end = f"{year}-12-31"
            else:
                end_date = datetime.date(year, month + 1, 1) - datetime.timedelta(
                    days=1
                )
                end = end_date.isoformat()

            resp = client.get(
                ARCHIVE_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": start,
                    "end_date": end,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "timezone": "auto",
                },
            )
            data = resp.json()
            daily = data.get("daily", {})
            all_temps_max.extend(daily.get("temperature_2m_max", []))
            all_temps_min.extend(daily.get("temperature_2m_min", []))
            all_precip.extend(daily.get("precipitation_sum", []))

    def safe_avg(values: list) -> float | None:
        clean = [v for v in values if v is not None]
        return round(sum(clean) / len(clean), 1) if clean else None

    return {
        "city": city,
        "month": month,
        "avg_temp_max": safe_avg(all_temps_max),
        "avg_temp_min": safe_avg(all_temps_min),
        "avg_daily_precipitation_mm": safe_avg(all_precip),
        "data_years": 5,
    }
