"""Earthquake service — ingest (dedup 2 lapis) + query + cache hot path."""
import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from math import asin, cos, radians, sin, sqrt

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_delete_pattern, cache_get_json, cache_set_json
from app.models import Earthquake
from app.schemas.earthquake import EarthquakeCreate, EarthquakeRead

logger = logging.getLogger("app.services.earthquake")

# Toleransi pencocokan event sama antar provider (BMKG vs USGS)
TIME_TOLERANCE = timedelta(seconds=150)
DISTANCE_TOLERANCE_KM = 100.0
MAGNITUDE_TOLERANCE = 0.8

LATEST_CACHE_TTL = 60  # detik

# Task BMKG (60s) & USGS (300s) bisa berjalan paralel — ingest diserialisasi
_ingest_lock = asyncio.Lock()


@dataclass(slots=True)
class IngestResult:
    inserted: int = 0
    duplicate: int = 0
    similar: int = 0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    rlat1, rlon1, rlat2, rlon2 = map(radians, (lat1, lon1, lat2, lon2))
    a = (
        sin((rlat2 - rlat1) / 2) ** 2
        + cos(rlat1) * cos(rlat2) * sin((rlon2 - rlon1) / 2) ** 2
    )
    return 2 * 6371.0 * asin(sqrt(a))


def _is_similar(row: Earthquake, event: EarthquakeCreate) -> bool:
    """Event yang sama dari provider lain? (Δt≤150s, Δjarak≤100km, ΔM≤0.8).

    Mencegah marker ganda di map & double-count KPI saat BMKG dan USGS
    melaporkan gempa yang sama.
    """
    if abs(row.magnitude - event.magnitude) > MAGNITUDE_TOLERANCE:
        return False
    if abs((row.event_time - event.event_time).total_seconds()) > (
        TIME_TOLERANCE.total_seconds()
    ):
        return False
    return (
        haversine_km(row.latitude, row.longitude, event.latitude, event.longitude)
        <= DISTANCE_TOLERANCE_KM
    )


async def ingest_earthquakes(
    session: AsyncSession, events: list[EarthquakeCreate]
) -> IngestResult:
    """Simpan event baru; duplikat/similar dilewati. Satu SELECT + satu commit."""
    result = IngestResult()
    if not events:
        return result
    async with _ingest_lock:
        min_t = min(e.event_time for e in events) - TIME_TOLERANCE
        max_t = max(e.event_time for e in events) + TIME_TOLERANCE
        rows = list(
            (
                await session.scalars(
                    sa.select(Earthquake).where(
                        Earthquake.event_time.between(min_t, max_t)
                    )
                )
            ).all()
        )
        known = {(r.provider, r.source_id) for r in rows}
        for event in events:
            if (event.provider, event.source_id) in known:
                result.duplicate += 1
                continue
            if any(_is_similar(r, event) for r in rows):
                result.similar += 1
                continue
            row = Earthquake(**event.model_dump())
            session.add(row)
            rows.append(row)
            known.add((event.provider, event.source_id))
            result.inserted += 1
        if result.inserted:
            await session.commit()
    if result.inserted:
        await cache_delete_pattern("eq:latest:*")
    return result


async def get_latest(session: AsyncSession, limit: int = 20) -> list[EarthquakeRead]:
    """Event terbaru — Redis cache first, fallback DB."""
    key = f"eq:latest:{limit}"
    cached = await cache_get_json(key)
    if cached is not None:
        return [EarthquakeRead.model_validate(item) for item in cached]
    stmt = sa.select(Earthquake).order_by(Earthquake.event_time.desc()).limit(limit)
    items = [
        EarthquakeRead.model_validate(row) for row in (await session.scalars(stmt)).all()
    ]
    await cache_set_json(
        key, [item.model_dump(mode="json") for item in items], LATEST_CACHE_TTL
    )
    return items


async def get_recent(
    session: AsyncSession,
    *,
    hours: int = 24,
    min_magnitude: float | None = None,
    max_magnitude: float | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[EarthquakeRead], int]:
    """Query dengan filter + pagination. Return (items, total)."""
    since = datetime.now(UTC) - timedelta(hours=hours)
    conditions = [Earthquake.event_time >= since]
    if min_magnitude is not None:
        conditions.append(Earthquake.magnitude >= min_magnitude)
    if max_magnitude is not None:
        conditions.append(Earthquake.magnitude <= max_magnitude)
    where = sa.and_(*conditions)

    total = await session.scalar(
        sa.select(sa.func.count()).select_from(Earthquake).where(where)
    )
    stmt = (
        sa.select(Earthquake)
        .where(where)
        .order_by(Earthquake.event_time.desc())
        .limit(limit)
        .offset(offset)
    )
    items = [
        EarthquakeRead.model_validate(row) for row in (await session.scalars(stmt)).all()
    ]
    return items, total or 0
