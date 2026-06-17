"""Cognito JWT verification for production + mock auth for local dev."""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

import httpx
from fastapi import HTTPException, Request
from jose import JWTError, jwt

from .config import settings
from .exceptions import AuthenticationError

logger = logging.getLogger(__name__)

# Thread-safe JWKS cache with async lock
_jwks_cache: dict[str, Any] | None = None
_jwks_lock = asyncio.Lock()


async def _get_jwks() -> dict[str, Any]:
    """Fetch JWKS from Cognito (cached after first call) with async lock."""
    global _jwks_cache

    # Double-checked locking pattern for async safety
    if _jwks_cache is not None:
        return _jwks_cache

    async with _jwks_lock:
        # Check again inside lock to avoid race condition
        if _jwks_cache is not None:
            return _jwks_cache

        url = (
            f"https://cognito-idp.{settings.aws_region}.amazonaws.com"
            f"/{settings.user_pool_id}/.well-known/jwks.json"
        )
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            return _jwks_cache


def _extract_token(request: Request) -> str | None:
    """Extract Bearer token from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


async def get_current_user_id(request: Request) -> str:
    """Extract authenticated user ID from JWT or mock auth (local dev only)."""
    # SECURITY: Only allow local dev auth in non-production environments
    if settings.local_dev:
        # Local development mode - use X-User-Id header or default
        user_id = request.headers.get("X-User-Id", settings.local_user_id)
        logger.debug(f"Local dev mode, using user_id={user_id}")
        return user_id

    # Production mode - require valid JWT
    token = _extract_token(request)
    if not token:
        raise AuthenticationError("Missing authorization token")

    try:
        jwks = await _get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key
        rsa_key: dict[str, str] = {}
        for key in jwks.get("keys", []):
            if key["kid"] == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if not rsa_key:
            raise AuthenticationError("Invalid token key")

        # Verify and decode token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.user_pool_client_id,
            issuer=f"https://cognito-idp.{settings.aws_region}.amazonaws.com/{settings.user_pool_id}",
        )

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token missing sub claim")
        return user_id

    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise AuthenticationError(f"Invalid token: {e}")
    except AuthenticationError:
        raise
    except Exception as e:
        logger.error(f"Unexpected auth error: {e}", exc_info=True)
        raise AuthenticationError("Authentication failed")
