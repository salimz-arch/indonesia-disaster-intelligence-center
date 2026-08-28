"""Analytics endpoints — agregasi historis (§20)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import ok
from app.core.cache import cache_get_json, cache_set_json
from app.services.analytics_service import (
    earthquake_analytics,
    rainfall_analytics,
    weather_analytics,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])
CACHE_TTL = 900  # 15 menit


async def _cached(key: str, fn, db: AsyncSession, days: int):
    cached = await cache_get_json(key)
    if cached is not None:
        return ok(cached, source="database")
    data = await fn(db, days)
    await cache_set_json(key, data, CACHE_TTL)
    return ok(data, source="database")


@router.get("/earthquakes")
async def analytics_earthquakes(
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _cached(f"analytics:eq:{days}", earthquake_analytics, db, days)


@router.get("/rainfall")
async def analytics_rainfall(
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _cached(f"analytics:rain:{days}", rainfall_analytics, db, days)


@router.get("/weather")
async def analytics_weather(
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _cached(f"analytics:wx:{days}", weather_analytics, db, days)
