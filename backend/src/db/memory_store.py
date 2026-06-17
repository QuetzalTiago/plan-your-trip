"""In-memory store — drop-in replacement for PostgreSQL during tests."""

from __future__ import annotations

import time
from typing import Any

from ..types import TripItem, MessageItem, ItineraryItem

_trips: dict[str, TripItem] = {}
_messages: dict[str, list[MessageItem]] = {}
_itineraries: dict[str, list[ItineraryItem]] = {}


# ─── Trips ────────────────────────────────────────────────────────────────────


def put_trip(item: TripItem) -> None:
    _trips[item.trip_id] = item


def get_trip(user_id: str, trip_id: str) -> TripItem | None:
    trip = _trips.get(trip_id)
    if trip and trip.user_id == user_id:
        return trip
    return None


def list_trips(user_id: str, limit: int = 50) -> list[TripItem]:
    user_trips = [t for t in _trips.values() if t.user_id == user_id]
    sorted_trips = sorted(user_trips, key=lambda t: t.created_at, reverse=True)
    return sorted_trips[:limit]


def delete_trip_and_children(user_id: str, trip_id: str) -> None:
    trip = _trips.get(trip_id)
    if trip and trip.user_id == user_id:
        del _trips[trip_id]
        _messages.pop(trip_id, None)
        _itineraries.pop(trip_id, None)


def update_trip_status(user_id: str, trip_id: str, status: str) -> None:
    trip = get_trip(user_id, trip_id)
    if trip:
        trip.status = status
        trip.updated_at = int(time.time() * 1000)


# ─── Messages ─────────────────────────────────────────────────────────────────


def put_message(item: MessageItem) -> None:
    if item.trip_id not in _messages:
        _messages[item.trip_id] = []
    _messages[item.trip_id].append(item)


def put_messages_batch(items: list[MessageItem]) -> None:
    """Save multiple messages in batch."""
    for item in items:
        put_message(item)


def get_messages(trip_id: str, limit: int = 100, after: int = 0) -> list[MessageItem]:
    trip_messages = _messages.get(trip_id, [])
    if after:
        trip_messages = [m for m in trip_messages if m.created_at > after]
    sorted_msgs = sorted(trip_messages, key=lambda m: m.created_at)
    return sorted_msgs[:limit]


# ─── Itineraries ──────────────────────────────────────────────────────────────


def put_itinerary(item: ItineraryItem) -> None:
    if item.trip_id not in _itineraries:
        _itineraries[item.trip_id] = []
    _itineraries[item.trip_id].append(item)


def get_latest_itinerary(trip_id: str) -> ItineraryItem | None:
    trip_itineraries = _itineraries.get(trip_id, [])
    if not trip_itineraries:
        return None
    return max(trip_itineraries, key=lambda i: i.version)
