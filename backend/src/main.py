"""Voyager API — FastAPI application."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .config import settings
from .api import trips, chat, itinerary, export

# Configure logging for production (JSON format for CloudWatch)
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","message":"%(message)s"}',
)

# Rate limiter (per-user limits based on IP or auth header)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(title="Voyager", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Parse CORS origins (supports comma-separated list)
cors_origins = [origin.strip() for origin in settings.cors_origin.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(trips.router)
app.include_router(chat.router)
app.include_router(itinerary.router)
app.include_router(export.router)


@app.get("/")
async def health():
    """Health check endpoint with dependency verification."""
    status = "ok"
    checks = {
        "database": "unknown",
        "gemini_api": "unknown",
        "serpapi": "unknown",
    }

    # Check database connectivity
    try:
        from . import db

        # Simple query to verify DB is accessible
        with db.postgres.get_connection() as conn:
            with db.postgres.get_cursor(conn) as cur:
                cur.execute("SELECT 1")
                checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        status = "degraded"

    # Check API keys are configured
    checks["gemini_api"] = "ok" if settings.gemini_api_key else "not_configured"
    checks["serpapi"] = "ok" if settings.serpapi_api_key else "not_configured"

    if checks["gemini_api"] == "not_configured" and not settings.mock_ai:
        status = "degraded"

    return {
        "status": status,
        "service": "voyager",
        "checks": checks,
    }
