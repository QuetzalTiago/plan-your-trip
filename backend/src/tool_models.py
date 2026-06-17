"""Manual input validation for tools."""

from __future__ import annotations

from dataclasses import dataclass
import re


def validate_iata_code(code: str, field_name: str = "IATA code") -> str:
    """Validate and uppercase IATA airport code."""
    if not isinstance(code, str):
        raise ValueError(f"{field_name} must be a string")
    code = code.upper()
    if len(code) != 3:
        raise ValueError(f"{field_name} must be exactly 3 characters")
    if not code.isalpha():
        raise ValueError(f"{field_name} must contain only letters")
    return code


def validate_date_format(date_str: str, field_name: str = "date") -> str:
    """Validate date is in YYYY-MM-DD format."""
    if not isinstance(date_str, str):
        raise ValueError(f"{field_name} must be a string")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        raise ValueError(f"{field_name} must be in YYYY-MM-DD format")
    return date_str


def validate_int_range(value: int, min_val: int, max_val: int, field_name: str = "value") -> int:
    """Validate integer is within range."""
    if not isinstance(value, int):
        raise ValueError(f"{field_name} must be an integer")
    if value < min_val or value > max_val:
        raise ValueError(f"{field_name} must be between {min_val} and {max_val}")
    return value


def validate_float_range(value: float, min_val: float, max_val: float, field_name: str = "value") -> float:
    """Validate float is within range."""
    if not isinstance(value, (int, float)):
        raise ValueError(f"{field_name} must be a number")
    value = float(value)
    if value < min_val or value > max_val:
        raise ValueError(f"{field_name} must be between {min_val} and {max_val}")
    return value


def validate_string_length(value: str, min_len: int, max_len: int, field_name: str = "value") -> str:
    """Validate string length."""
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a string")
    if len(value) < min_len or len(value) > max_len:
        raise ValueError(f"{field_name} must be between {min_len} and {max_len} characters")
    return value


@dataclass
class FlightSearchInput:
    """Input validation for flight search."""

    origin: str
    destination: str
    departure_date: str
    return_date: str | None = None
    adults: int = 1
    max_results: int = 5

    def __post_init__(self):
        self.origin = validate_iata_code(self.origin, "origin")
        self.destination = validate_iata_code(self.destination, "destination")
        self.departure_date = validate_date_format(self.departure_date, "departure_date")
        if self.return_date:
            self.return_date = validate_date_format(self.return_date, "return_date")
        self.adults = validate_int_range(self.adults, 1, 9, "adults")
        self.max_results = validate_int_range(self.max_results, 1, 20, "max_results")


@dataclass
class CheapestDatesInput:
    """Input validation for cheapest dates search."""

    origin: str
    destination: str

    def __post_init__(self):
        self.origin = validate_iata_code(self.origin, "origin")
        self.destination = validate_iata_code(self.destination, "destination")


@dataclass
class HotelSearchInput:
    """Input validation for hotel search."""

    city: str
    check_in: str
    check_out: str
    adults: int = 1
    max_results: int = 5

    def __post_init__(self):
        self.city = validate_string_length(self.city, 2, 100, "city")
        self.check_in = validate_date_format(self.check_in, "check_in")
        self.check_out = validate_date_format(self.check_out, "check_out")
        self.adults = validate_int_range(self.adults, 1, 9, "adults")
        self.max_results = validate_int_range(self.max_results, 1, 20, "max_results")


@dataclass
class WeatherForecastInput:
    """Input validation for weather forecast."""

    city: str
    start_date: str | None = None
    end_date: str | None = None

    def __post_init__(self):
        self.city = validate_string_length(self.city, 2, 100, "city")
        if self.start_date:
            self.start_date = validate_date_format(self.start_date, "start_date")
        if self.end_date:
            self.end_date = validate_date_format(self.end_date, "end_date")


@dataclass
class HistoricalClimateInput:
    """Input validation for historical climate."""

    city: str
    month: int

    def __post_init__(self):
        self.city = validate_string_length(self.city, 2, 100, "city")
        self.month = validate_int_range(self.month, 1, 12, "month")


@dataclass
class AttractionsInput:
    """Input validation for attractions search."""

    latitude: float
    longitude: float
    radius: int = 10
    max_results: int = 10

    def __post_init__(self):
        self.latitude = validate_float_range(self.latitude, -90, 90, "latitude")
        self.longitude = validate_float_range(self.longitude, -180, 180, "longitude")
        self.radius = validate_int_range(self.radius, 1, 50, "radius")
        self.max_results = validate_int_range(self.max_results, 1, 50, "max_results")


@dataclass
class LocalEventsInput:
    """Input validation for local events search."""

    city: str
    start_date: str
    end_date: str

    def __post_init__(self):
        self.city = validate_string_length(self.city, 2, 100, "city")
        self.start_date = validate_date_format(self.start_date, "start_date")
        self.end_date = validate_date_format(self.end_date, "end_date")
