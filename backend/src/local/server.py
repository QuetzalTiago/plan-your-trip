"""Local development server — wraps the FastAPI app with mock auth and memory store fallback."""

from __future__ import annotations

import logging
import os

# Set local dev defaults before importing anything else
os.environ.setdefault("LOCAL_DEV", "true")
os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("POSTGRES_PORT", "5432")
os.environ.setdefault("POSTGRES_DB", "voyager_local")
os.environ.setdefault("POSTGRES_USER", "voyager_dev")
os.environ.setdefault("POSTGRES_PASSWORD", "local_dev_password")
os.environ.setdefault("AWS_REGION", "us-east-1")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from ..config import settings
from ..api import trips, chat, itinerary, export

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Voyager (Local Dev)", version="0.1.0")

logger.info('[SERVER] - "Initializing FastAPI app for local development"')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info('[SERVER] - "CORS middleware configured"')

app.include_router(trips.router)
app.include_router(chat.router)
app.include_router(itinerary.router)
app.include_router(export.router)

logger.info('[SERVER] - "All routers registered"')


@app.get("/")
async def health():
    logger.info('[SERVER] - "Health check endpoint called"')
    return {
        "status": "ok",
        "service": "voyager",
        "env": "local",
        "user": settings.local_user_id,
        "mock_ai": settings.mock_ai,
        "has_gemini_key": bool(settings.gemini_api_key),
        "has_serpapi_key": bool(settings.serpapi_api_key),
    }


# Mock auth endpoints for local dev
@app.post("/auth/magic-link")
async def mock_magic_link(request: Request):
    body = await request.json()
    return {"message": f"Magic link sent to {body.get('email', 'test@local')}"}


@app.get("/auth/verify")
async def mock_verify():
    return {
        "idToken": "local-dev-token",
        "user": {
            "id": settings.local_user_id,
            "email": "dev@voyager.local",
            "plan": "explorer",
        },
    }
