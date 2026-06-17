"""Itinerary API routes."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException

from ..auth import get_current_user_id
from .. import db
from ..types import ItineraryResponse, DayPlan, Activity, FlightOffer, HotelOffer

router = APIRouter(prefix="/trips", tags=["itinerary"])


@router.get("/{trip_id}/itinerary")
async def get_itinerary(
    trip_id: str,
    user_id: str = Depends(get_current_user_id),
) -> ItineraryResponse | None:
    """Get the latest itinerary for a trip."""
    trip = db.get_trip(user_id, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    item = db.get_latest_itinerary(trip_id)
    if not item:
        return None

    days_data = json.loads(item.days) if isinstance(item.days, str) else item.days
    flights_data = (
        json.loads(item.flights) if isinstance(item.flights, str) else item.flights
    )
    hotels_data = (
        json.loads(item.hotels) if isinstance(item.hotels, str) else item.hotels
    )

    return ItineraryResponse(
        version=item.version,
        days=[DayPlan(**d) for d in days_data],
        flights=[FlightOffer(**f) for f in flights_data],
        hotels=[HotelOffer(**h) for h in hotels_data],
        estimated_total_cost=item.estimated_total_cost,
        currency=item.currency,
        created_at=item.created_at,
    )
