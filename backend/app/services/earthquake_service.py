"""Earthquake service — ingest (dedup 2 lapis) + query + stats + cache."""
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
    """Event sama dari provider lain? (Δt≤150s, Δjarak≤100km, ΔM≤0.8)."""
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
        # Invalidasi SEMUA cache earthquake: latest + stats
        await cache_delete_pattern("eq:*")
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


# ── Stats (modul earthquake § Step 9) ──

# Band kategori — HARUS sinkron dengan MagnitudeCategory frontend/backend
_MAGNITUDE_BANDS: list[tuple[str, float | None, float | None]] = [
    ("low", None, 3.0),
    ("moderate", 3.0, 4.0),
    ("significant", 4.0, 5.0),
    ("strong", 5.0, 6.0),
    ("major", 6.0, 7.0),
    ("severe", 7.0, None),
]


async def get_stats(session: AsyncSession, hours: int = 24) -> dict:
    """Statistik agregat window waktu — JSON-serializable (siap cache + envelope)."""
    since = datetime.now(UTC) - timedelta(hours=hours)
    base = Earthquake.event_time >= since

    total = await session.scalar(
        sa.select(sa.func.count()).select_from(Earthquake).where(base)
    )

    strongest = (
        await session.scalars(
            sa.select(Earthquake)
            .where(base)
            .order_by(Earthquake.magnitude.desc(), Earthquake.event_time.desc())
            .limit(1)
        )
    ).first()

    recent = (
        await session.scalars(
            sa.select(Earthquake)
            .where(base)
            .order_by(Earthquake.event_time.desc())
            .limit(1)
        )
    ).first()

    avg_depth = await session.scalar(
        sa.select(sa.func.avg(Earthquake.depth_km)).where(base)
    )

    distribution: dict[str, int] = {}
    for name, lo, hi in _MAGNITUDE_BANDS:
        conditions = [base]
        if lo is not None:
            conditions.append(Earthquake.magnitude >= lo)
        if hi is not None:
            conditions.append(Earthquake.magnitude < hi)
        count = await session.scalar(
            sa.select(sa.func.count())
            .select_from(Earthquake)
            .where(sa.and_(*conditions))
        )
        distribution[name] = count or 0

    return {
        "hours": hours,
        "total": total or 0,
        "max_magnitude": (
            EarthquakeRead.model_validate(strongest).model_dump(mode="json")
            if strongest
            else None
        ),
        "recent": (
            EarthquakeRead.model_validate(recent).model_dump(mode="json")
            if recent
            else None
        ),
        "avg_depth_km": round(avg_depth, 1) if avg_depth is not None else None,
        "distribution": distribution,
    }
