"""Custom exceptions for Voyager application."""

from __future__ import annotations


class VoyagerException(Exception):
    """Base exception for all Voyager errors."""

    pass


class AuthenticationError(VoyagerException):
    """Raised when authentication fails."""

    pass


class ToolExecutionError(VoyagerException):
    """Raised when a tool execution fails."""

    def __init__(self, tool_name: str, message: str):
        self.tool_name = tool_name
        super().__init__(f"Tool '{tool_name}' failed: {message}")


class AIAPIError(VoyagerException):
    """Raised when AI API calls fail."""

    pass


class DatabaseError(VoyagerException):
    """Raised when database operations fail."""

    pass


class ValidationError(VoyagerException):
    """Raised when input validation fails."""

    pass


class ExternalAPIError(VoyagerException):
    """Raised when external API calls (Serpapi, etc.) fail."""

    def __init__(self, service: str, message: str):
        self.service = service
        super().__init__(f"{service} API error: {message}")
