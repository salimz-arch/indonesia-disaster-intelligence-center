"""Earthquake endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import ok
from app.core.cache import cache_get_json, cache_set_json
from app.services.earthquake_service import get_latest, get_recent, get_stats

router = APIRouter(prefix="/earthquakes", tags=["earthquakes"])

STATS_CACHE_TTL = 60  # detik — seirama invalidasi ingest


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


@router.get("/stats")
async def earthquake_stats(
    hours: int = Query(24, ge=1, le=2160, description="Rentang waktu (jam)"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Statistik agregat: total, terbesar, distribusi magnitude, kedalaman rata-rata."""
    key = f"eq:stats:{hours}"
    cached = await cache_get_json(key)
    if cached is not None:
        return ok(cached, source="database")
    stats = await get_stats(db, hours)
    await cache_set_json(key, stats, STATS_CACHE_TTL)
    return ok(stats, source="database")


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
