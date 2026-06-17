"""Local events search using Gemini Google Search grounding."""

from __future__ import annotations

from typing import Any

from google import genai
from google.genai import types

from ..config import settings


def search_local_events(
    city: str,
    country: str,
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict[str, Any]:
    """Search for local events happening in a city during travel dates."""
    if not settings.gemini_api_key:
        return {"error": "GEMINI_API_KEY not configured", "events_summary": ""}

    try:
        client = genai.Client(api_key=settings.gemini_api_key)

        date_range = ""
        if date_from and date_to:
            date_range = f" between {date_from} and {date_to}"
        elif date_from:
            date_range = f" around {date_from}"

        prompt = (
            f"What major events, festivals, public holidays, or cultural celebrations "
            f"are happening in {city}, {country}{date_range}? "
            f"List the top events with dates, descriptions, and locations. "
            f"Keep it concise (2-3 sentences per event)."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
            ),
        )

        return {"events_summary": response.text, "city": city, "country": country}
    except Exception as e:
        return {"error": f"Events search failed: {str(e)}", "events_summary": ""}
