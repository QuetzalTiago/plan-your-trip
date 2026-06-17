"""Export trip plan as Markdown."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse

from ..auth import get_current_user_id
from .. import db

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/{trip_id}")
async def export_trip(
    trip_id: str,
    user_id: str = Depends(get_current_user_id),
) -> PlainTextResponse:
    """Export trip plan as Markdown."""
    trip = db.get_trip(user_id, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    itinerary = db.get_latest_itinerary(trip_id)
    messages = db.get_messages(trip_id)

    lines = [
        f"# {trip.title}",
        "",
        f"**Destination:** {trip.destination_city}, {trip.destination_country}",
        f"**Origin:** {trip.origin_city}" if trip.origin_city else "",
        f"**Dates:** {trip.date_from or 'TBD'} → {trip.date_to or 'TBD'}",
        f"**Travelers:** {trip.travelers_count}",
        f"**Budget:** {trip.budget_range}",
        f"**Style:** {trip.trip_style}",
        "",
    ]

    if itinerary:
        lines.append("---")
        lines.append("")
        lines.append("## Itinerary")
        lines.append("")

        days = (
            json.loads(itinerary.days)
            if isinstance(itinerary.days, str)
            else itinerary.days
        )
        for day in days:
            lines.append(f"### {day.get('date', 'Day')}")
            for act in day.get("activities", []):
                time_str = f"**{act.get('time', '')}** " if act.get("time") else ""
                cost = (
                    f" (€{act.get('cost_estimate', '')})"
                    if act.get("cost_estimate")
                    else ""
                )
                lines.append(f"- {time_str}{act.get('name', '')}{cost}")
            lines.append("")

        if itinerary.estimated_total_cost:
            lines.append(f"**Estimated Total:** €{itinerary.estimated_total_cost}")
            lines.append("")

    # Add conversation highlights (assistant messages only)
    assistant_msgs = [m for m in messages if m.role == "assistant"]
    if assistant_msgs:
        lines.append("---")
        lines.append("")
        lines.append("## Planning Notes")
        lines.append("")
        for msg in assistant_msgs[-5:]:  # Last 5 assistant messages
            lines.append(msg.content)
            lines.append("")

    content = "\n".join(lines)
    return PlainTextResponse(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="voyager-{trip_id}.md"'},
    )
