"""Earthquake endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import ok
from app.services.earthquake_service import get_latest, get_recent

router = APIRouter(prefix="/earthquakes", tags=["earthquakes"])


@router.get("/latest")
async def latest_earthquakes(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Event gempa terbaru (cache Redis 60 detik)."""
    items = await get_latest(db, limit)
    return ok(
        {
            "items": [i.model_dump(mode="json") for i in items],
            "total": len(items),
        },
        source="database",
    )


@router.get("")
async def list_earthquakes(
    hours: int = Query(24, ge=1, le=2160, description="Rentang waktu (jam)"),
    min_magnitude: float | None = Query(None, ge=-1, le=10),
    max_magnitude: float | None = Query(None, ge=-1, le=10),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Query gempa dengan filter + pagination."""
    items, total = await get_recent(
        db,
        hours=hours,
        min_magnitude=min_magnitude,
        max_magnitude=max_magnitude,
        limit=limit,
        offset=offset,
    )
    return ok(
        {
            "items": [i.model_dump(mode="json") for i in items],
            "total": total,
        },
        source="database",
    )
