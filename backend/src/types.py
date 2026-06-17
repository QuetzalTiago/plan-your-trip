from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

# ─── Enums ────────────────────────────────────────────────────────────────────


class TripStatus(str, Enum):
    planning = "planning"
    booked = "booked"
    completed = "completed"


class BudgetRange(str, Enum):
    low = "low"
    mid = "mid"
    high = "high"


class TripStyle(str, Enum):
    adventure = "adventure"
    relaxation = "relaxation"
    cultural = "cultural"
    mixed = "mixed"


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    tool_call = "tool_call"
    tool_result = "tool_result"


# ─── Request / Response models ────────────────────────────────────────────────


@dataclass
class CreateTripRequest:
    destination_city: str
    destination_country: str
    destination_iata: str = ""
    origin_city: str = ""
    origin_iata: str = ""
    date_from: str | None = None
    date_to: str | None = None
    travelers_count: int = 1
    budget_range: BudgetRange = BudgetRange.mid
    trip_style: TripStyle = TripStyle.mixed


@dataclass
class TripResponse:
    id: str
    title: str
    destination_city: str
    destination_country: str
    destination_iata: str
    origin_city: str
    origin_iata: str
    date_from: str | None
    date_to: str | None
    travelers_count: int
    budget_range: str
    trip_style: str
    status: str
    created_at: int
    updated_at: int
    auto_planning_enabled: bool = True  # Whether auto-planning should trigger


@dataclass
class TripListItem:
    id: str
    title: str
    destination_city: str
    destination_country: str
    status: str
    created_at: int


@dataclass
class ChatRequest:
    message: str


@dataclass
class MessageResponse:
    id: str
    trip_id: str
    role: str
    content: str
    created_at: int
    tool_name: str | None = None


@dataclass
class Activity:
    name: str
    time: str = ""
    type: str = ""
    location: str = ""
    notes: str = ""
    cost_estimate: float | None = None
    latitude: float | None = None
    longitude: float | None = None


@dataclass
class DayPlan:
    date: str
    activities: list[Activity] = field(default_factory=list)


@dataclass
class FlightOffer:
    airline: str = ""
    departure: str = ""
    arrival: str = ""
    duration: str = ""
    stops: int = 0
    price: float = 0
    currency: str = "EUR"
    outbound: str = ""
    inbound: str = ""


@dataclass
class HotelOffer:
    name: str = ""
    rating: float | None = None
    price_per_night: float | None = None
    currency: str = "EUR"
    address: str = ""
    amenities: list[str] = field(default_factory=list)
    latitude: float | None = None
    longitude: float | None = None


@dataclass
class ItineraryResponse:
    version: int
    days: list[DayPlan] = field(default_factory=list)
    flights: list[FlightOffer] = field(default_factory=list)
    hotels: list[HotelOffer] = field(default_factory=list)
    estimated_total_cost: float | None = None
    currency: str = "EUR"
    created_at: int = 0


# ─── Internal DB items ────────────────────────────────────────────────────────


@dataclass
class TripItem:
    user_id: str
    trip_id: str
    title: str
    destination_city: str
    destination_country: str
    destination_iata: str = ""
    origin_city: str = ""
    origin_iata: str = ""
    date_from: str | None = None
    date_to: str | None = None
    travelers_count: int = 1
    budget_range: str = "mid"  # BudgetRange value
    trip_style: str = "mixed"  # TripStyle value
    status: str = "planning"  # TripStatus value
    created_at: int = 0
    updated_at: int = 0


@dataclass
class MessageItem:
    trip_id: str
    message_id: str
    role: str  # MessageRole value
    content: str
    tool_name: str | None = None
    tool_call_id: str | None = None
    created_at: int = 0


@dataclass
class ItineraryItem:
    trip_id: str
    version: int
    days: str = "[]"  # JSON
    flights: str = "[]"  # JSON
    hotels: str = "[]"  # JSON
    estimated_total_cost: float | None = None
    currency: str = "EUR"
    created_at: int = 0
