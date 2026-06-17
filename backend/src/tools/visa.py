"""Visa requirements tool using Gemini Google Search grounding."""

from __future__ import annotations

from typing import Any

from google import genai
from google.genai import types

from ..config import settings


def get_visa_requirements(
    passport_country: str,
    destination_country: str,
) -> dict[str, Any]:
    """Get visa requirements for a passport holder visiting a destination."""
    if not settings.gemini_api_key:
        return {
            "error": "GEMINI_API_KEY not configured",
            "requirements": "",
        }

    try:
        client = genai.Client(api_key=settings.gemini_api_key)

        prompt = (
            f"What are the visa requirements for a {passport_country} passport holder "
            f"traveling to {destination_country}? Include: "
            f"1. Whether a visa is required or visa-free "
            f"2. Maximum stay duration for visa-free entry "
            f"3. Required documents "
            f"4. Any recent policy changes. "
            f"Keep it concise (3-4 sentences)."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
            ),
        )

        return {
            "passport_country": passport_country,
            "destination_country": destination_country,
            "requirements": response.text,
        }
    except Exception as e:
        return {
            "error": f"Visa search failed: {str(e)}",
            "requirements": "",
        }
