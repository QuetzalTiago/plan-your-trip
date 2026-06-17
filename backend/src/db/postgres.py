from __future__ import annotations

import json
import logging
import os
import time
import uuid
from contextlib import contextmanager
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from psycopg2 import OperationalError, IntegrityError

from ..config import settings
from ..exceptions import DatabaseError
from ..types import TripItem, MessageItem, ItineraryItem

logger = logging.getLogger(__name__)

try:
    _pool = SimpleConnectionPool(
        minconn=1,
        maxconn=10,
        host=settings.postgres_host,
        port=settings.postgres_port,
        database=settings.postgres_db,
        user=settings.postgres_user,
        password=settings.postgres_password,
        sslmode="require",  # RDS requires SSL
        connect_timeout=10,
        options="-c statement_timeout=30000",  # 30s query timeout
    )
    logger.info(
        f"Connection pool created for {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"
    )
except OperationalError as e:
    logger.error(f"Failed to create connection pool: {e}")
    raise DatabaseError(f"Database connection failed: {e}")


def _get_pool() -> SimpleConnectionPool:
    """Get the connection pool."""
    return _pool


@contextmanager
def get_connection():
    """Context manager for database connections with automatic commit/rollback."""
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Transaction rolled back: {e}")
        raise
    finally:
        pool.putconn(conn)


@contextmanager
def get_cursor(conn):
    """Context manager for cursors with RealDictCursor."""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        yield cursor
    finally:
        cursor.close()


# ─── Helper Functions ─────────────────────────────────────────────────────────


def _ensure_user_exists(conn, user_id: str) -> None:
    """Ensure user exists in database (for Cognito users)."""
    try:
        with get_cursor(conn) as cur:
            cur.execute("SELECT ensure_user_exists(%s)", (user_id,))
    except Exception as e:
        logger.warning(f"Failed to ensure user exists: {e}")


def _row_to_trip_item(row: dict) -> TripItem:
    """Convert database row to TripItem."""
    return TripItem(
        user_id=str(row["user_id"]),
        trip_id=str(row["trip_id"]),
        title=row["title"],
        destination_city=row["destination_city"],
        destination_country=row["destination_country"],
        destination_iata=row["destination_iata"] or "",
        origin_city=row["origin_city"] or "",
        origin_iata=row["origin_iata"] or "",
        date_from=row["date_from"].isoformat() if row["date_from"] else None,
        date_to=row["date_to"].isoformat() if row["date_to"] else None,
        travelers_count=row["travelers_count"],
        budget_range=row["budget_range"],
        trip_style=row["trip_style"],
        status=row["status"],
        created_at=int(row["created_at"].timestamp() * 1000),
        updated_at=int(row["updated_at"].timestamp() * 1000),
    )


def _row_to_message_item(row: dict, trip_id: str) -> MessageItem:
    """Convert database row to MessageItem."""
    ts = int(row["created_at"].timestamp() * 1000)
    return MessageItem(
        trip_id=trip_id,
        message_id=str(row["message_id"]),
        role=row["role"],
        content=row["content"],
        tool_name=row["tool_name"],
        tool_call_id=str(row["tool_call_id"]) if row.get("tool_call_id") else None,
        created_at=ts,
    )


def _row_to_itinerary_item(row: dict) -> ItineraryItem:
    """Convert database row to ItineraryItem."""
    trip_id = str(row["trip_id"])
    return ItineraryItem(
        trip_id=trip_id,
        version=row["version"],
        days=(
            json.dumps(row["days"])
            if isinstance(row["days"], (list, dict))
            else row["days"]
        ),
        flights=(
            json.dumps(row["flights"])
            if isinstance(row["flights"], (list, dict))
            else row["flights"]
        ),
        hotels=(
            json.dumps(row["hotels"])
            if isinstance(row["hotels"], (list, dict))
            else row["hotels"]
        ),
        estimated_total_cost=(
            float(row["estimated_total_cost"]) if row["estimated_total_cost"] else None
        ),
        currency=row["currency"],
        created_at=int(row["created_at"].timestamp() * 1000),
    )


# ─── Trips ────────────────────────────────────────────────────────────────────


def put_trip(item: TripItem) -> None:
    """Save trip to PostgreSQL using raw INSERT."""
    try:
        with get_connection() as conn:
            _ensure_user_exists(conn, item.user_id)

            with get_cursor(conn) as cur:
                cur.execute(
                    """
                    INSERT INTO trips (
                        trip_id, user_id, title, destination_city, destination_country,
                        destination_iata, origin_city, origin_iata, date_from, date_to,
                        travelers_count, budget_range, trip_style, status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (trip_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        destination_city = EXCLUDED.destination_city,
                        destination_country = EXCLUDED.destination_country,
                        destination_iata = EXCLUDED.destination_iata,
                        origin_city = EXCLUDED.origin_city,
                        origin_iata = EXCLUDED.origin_iata,
                        date_from = EXCLUDED.date_from,
                        date_to = EXCLUDED.date_to,
                        travelers_count = EXCLUDED.travelers_count,
                        budget_range = EXCLUDED.budget_range,
                        trip_style = EXCLUDED.trip_style,
                        status = EXCLUDED.status,
                        updated_at = CURRENT_TIMESTAMP
                """,
                    (
                        item.trip_id,
                        item.user_id,
                        item.title,
                        item.destination_city,
                        item.destination_country,
                        item.destination_iata or None,
                        item.origin_city or None,
                        item.origin_iata or None,
                        item.date_from,
                        item.date_to,
                        item.travelers_count,
                        item.budget_range,
                        item.trip_style,
                        item.status,
                    ),
                )
    except IntegrityError as e:
        logger.error(f"Integrity error saving trip {item.trip_id}: {e}")
        raise DatabaseError(f"Failed to save trip: {e}")
    except OperationalError as e:
        logger.error(f"Operational error saving trip {item.trip_id}: {e}")
        raise DatabaseError(f"Database connection error: {e}")


def get_trip(user_id: str, trip_id: str) -> TripItem | None:
    """Get trip by user_id and trip_id using raw SELECT."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                cur.execute(
                    """
                    SELECT 
                        trip_id, user_id, title, destination_city, destination_country,
                        destination_iata, origin_city, origin_iata, date_from, date_to,
                        travelers_count, budget_range, trip_style, status,
                        created_at, updated_at
                    FROM trips
                    WHERE user_id = %s AND trip_id = %s
                """,
                    (user_id, trip_id),
                )
                row = cur.fetchone()

                if not row:
                    return None

                return _row_to_trip_item(row)
    except OperationalError as e:
        logger.error(f"Failed to get trip {trip_id}: {e}")
        raise DatabaseError(f"Database connection error: {e}")


def list_trips(user_id: str, limit: int = 50) -> list[TripItem]:
    """List trips for a user with pagination using raw SELECT."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                cur.execute(
                    """
                    SELECT 
                        trip_id, user_id, title, destination_city, destination_country,
                        destination_iata, origin_city, origin_iata, date_from, date_to,
                        travelers_count, budget_range, trip_style, status,
                        created_at, updated_at
                    FROM trips
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """,
                    (user_id, limit),
                )

                rows = cur.fetchall()
                return [_row_to_trip_item(row) for row in rows]
    except OperationalError as e:
        logger.error(f"Failed to list trips for user {user_id}: {e}")
        raise DatabaseError(f"Database connection error: {e}")


def delete_trip_and_children(user_id: str, trip_id: str) -> None:
    """Delete trip and all associated data using stored procedure."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                # Verify ownership before deletion
                cur.execute(
                    """
                    SELECT user_id FROM trips WHERE trip_id = %s
                """,
                    (trip_id,),
                )
                row = cur.fetchone()

                if not row:
                    raise DatabaseError(f"Trip {trip_id} not found")

                if str(row["user_id"]) != user_id:
                    raise DatabaseError(
                        f"Unauthorized: Trip {trip_id} does not belong to user {user_id}"
                    )

                # Call stored procedure for cascade delete
                cur.execute("SELECT delete_trip_cascade(%s)", (trip_id,))
                result = cur.fetchone()
                deleted_count = result["delete_trip_cascade"] if result else 0

                logger.info(
                    f"Deleted trip {trip_id} and {deleted_count} associated records"
                )
    except OperationalError as e:
        logger.error(f"Failed to delete trip {trip_id}: {e}")
        raise DatabaseError(f"Database connection error: {e}")


def update_trip_status(user_id: str, trip_id: str, status: str) -> None:
    """Update trip status using stored procedure."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                # Verify ownership
                cur.execute(
                    """
                    SELECT user_id FROM trips WHERE trip_id = %s
                """,
                    (trip_id,),
                )
                row = cur.fetchone()

                if not row:
                    raise DatabaseError(f"Trip {trip_id} not found")

                if str(row["user_id"]) != user_id:
                    raise DatabaseError(
                        f"Unauthorized: Trip {trip_id} does not belong to user {user_id}"
                    )

                # Update status
                cur.execute("SELECT update_trip_status(%s, %s)", (trip_id, status))
    except OperationalError as e:
        logger.error(f"Failed to update trip status {trip_id}: {e}")
        raise DatabaseError(f"Database connection error: {e}")


# ─── Messages ─────────────────────────────────────────────────────────────────


def put_message(item: MessageItem) -> None:
    """Save message to PostgreSQL using raw INSERT."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                cur.execute(
                    """
                    INSERT INTO messages (
                        message_id, trip_id, role, content, tool_name, tool_call_id, created_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, to_timestamp(%s / 1000.0)
                    )
                """,
                    (
                        item.message_id,
                        item.trip_id,
                        item.role,
                        item.content,
                        item.tool_name,
                        item.tool_call_id,
                        item.created_at,
                    ),
                )
    except OperationalError as e:
        logger.error(f"Failed to save message: {e}")
        raise DatabaseError(f"Database connection error: {e}")


def put_messages_batch(items: list[MessageItem]) -> None:
    """Save multiple messages in batch using stored procedure."""
    if not items:
        return

    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                # Prepare JSONB array
                messages_json = json.dumps(
                    [
                        {
                            "trip_id": m.trip_id,
                            "role": m.role,
                            "content": m.content,
                            "tool_name": m.tool_name,
                            "tool_call_id": m.tool_call_id,
                            "created_at": f"{m.created_at / 1000.0}",  # Convert to seconds
                        }
                        for m in items
                    ]
                )

                cur.execute("SELECT add_message_batch(%s::jsonb)", (messages_json,))
                result = cur.fetchone()
                inserted = result["add_message_batch"] if result else 0
                logger.debug(f"Batch inserted {inserted} messages")
    except OperationalError as e:
        logger.error(f"Failed to batch save messages: {e}")
        raise DatabaseError(f"Database connection error: {e}")


def get_messages(trip_id: str, limit: int = 100, after: int = 0) -> list[MessageItem]:
    """Get messages for a trip with pagination using raw SELECT."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                if after > 0:
                    cur.execute(
                        """
                        SELECT message_id, trip_id, role, content, tool_name, tool_call_id, created_at
                        FROM messages
                        WHERE trip_id = %s AND created_at > to_timestamp(%s / 1000.0)
                        ORDER BY created_at ASC
                        LIMIT %s
                    """,
                        (trip_id, after, limit),
                    )
                else:
                    cur.execute(
                        """
                        SELECT message_id, trip_id, role, content, tool_name, tool_call_id, created_at
                        FROM messages
                        WHERE trip_id = %s
                        ORDER BY created_at ASC
                        LIMIT %s
                    """,
                        (trip_id, limit),
                    )

                rows = cur.fetchall()
                return [_row_to_message_item(row, trip_id) for row in rows]
    except OperationalError as e:
        logger.error(f"Failed to get messages for trip {trip_id}: {e}")
        raise DatabaseError(f"Database connection error: {e}")


# ─── Itineraries ──────────────────────────────────────────────────────────────


def put_itinerary(item: ItineraryItem) -> None:
    """Save itinerary to PostgreSQL using stored procedure."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                # Parse JSON strings if needed
                days = (
                    json.loads(item.days) if isinstance(item.days, str) else item.days
                )
                flights = (
                    json.loads(item.flights)
                    if isinstance(item.flights, str)
                    else item.flights
                )
                hotels = (
                    json.loads(item.hotels)
                    if isinstance(item.hotels, str)
                    else item.hotels
                )

                cur.execute(
                    """
                    SELECT save_itinerary(
                        %s, %s::jsonb, %s::jsonb, %s::jsonb, %s, %s
                    )
                """,
                    (
                        item.trip_id,
                        json.dumps(days),
                        json.dumps(flights),
                        json.dumps(hotels),
                        item.estimated_total_cost,
                        item.currency,
                    ),
                )
    except OperationalError as e:
        logger.error(f"Failed to save itinerary: {e}")
        raise DatabaseError(f"Database connection error: {e}")


def get_latest_itinerary(trip_id: str) -> ItineraryItem | None:
    """Get the most recent itinerary for a trip using stored procedure."""
    try:
        with get_connection() as conn:
            with get_cursor(conn) as cur:
                cur.execute("SELECT * FROM get_latest_itinerary(%s)", (trip_id,))
                row = cur.fetchone()

                if not row:
                    return None

                return _row_to_itinerary_item(row)
    except OperationalError as e:
        logger.error(f"Failed to get itinerary for trip {trip_id}: {e}")
        raise DatabaseError(f"Database connection error: {e}")
