"""Periodic ingestion tasks — TIDAK PERNAH raise.

Kegagalan provider → status degraded + log warning; siklus berikutnya retry.
Ingest sukses → publish realtime event ke EventBus.
"""
import logging
from datetime import UTC, datetime, timedelta
from time import perf_counter

import sqlalchemy as sa

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.models import Location
from app.providers import get_bmkg_provider, get_usgs_provider, get_weather_provider
from app.realtime.bus import bus
from app.services.earthquake_service import ingest_earthquakes
from app.services.source_service import mark_failure, mark_success
from app.services.weather_service import ingest_observations

logger = logging.getLogger("app.collector")

SRC_BMKG = "bmkg-earthquake"
SRC_USGS = "usgs-earthquake"


async def _mark(
    names: list[str], *, ok: bool, latency_ms: int = 0, error: str = ""
) -> None:
    """Catat status ke data_sources — best effort, tidak pernah raise."""
    try:
        async with AsyncSessionLocal() as session:
            for name in names:
                if ok:
                    await mark_success(session, name, latency_ms)
                else:
                    await mark_failure(session, name, error)
    except Exception:
        logger.exception("gagal mencatat status source %s", names)


async def collect_bmkg() -> None:
    provider = get_bmkg_provider()
    t0 = perf_counter()
    try:
        events = await provider.fetch()
        async with AsyncSessionLocal() as session:
            result = await ingest_earthquakes(session, events)
        latency = int((perf_counter() - t0) * 1000)
        await _mark([SRC_BMKG], ok=True, latency_ms=latency)
        logger.info(
            "bmkg: fetch=%d inserted=%d dup=%d similar=%d (%dms)",
            len(events), result.inserted, result.duplicate, result.similar, latency,
        )
        if result.inserted:
            bus.publish(
                "earthquake.new",
                {
                    "events": [
                        e.model_dump(mode="json") for e in result.inserted_events
                    ]
                },
            )
    except Exception as exc:
        logger.warning("bmkg gagal: %s: %s", exc.__class__.__name__, exc)
        await _mark([SRC_BMKG], ok=False, error=f"{exc.__class__.__name__}: {exc}")


async def _collect_usgs_window(window: timedelta, label: str) -> None:
    provider = get_usgs_provider()
    if provider is None:  # mock mode
        return
    t0 = perf_counter()
    try:
        end = datetime.now(UTC)
        events = await provider.fetch_window(end - window, end)
        async with AsyncSessionLocal() as session:
            result = await ingest_earthquakes(session, events)
        latency = int((perf_counter() - t0) * 1000)
        await _mark([SRC_USGS], ok=True, latency_ms=latency)
        logger.info(
            "usgs[%s]: fetch=%d inserted=%d dup=%d similar=%d (%dms)",
            label, len(events), result.inserted, result.duplicate,
            result.similar, latency,
        )
        if result.inserted:
            bus.publish(
                "earthquake.new",
                {
                    "events": [
                        e.model_dump(mode="json") for e in result.inserted_events
                    ]
                },
            )
    except Exception as exc:
        logger.warning("usgs[%s] gagal: %s: %s", label, exc.__class__.__name__, exc)
        await _mark([SRC_USGS], ok=False, error=f"{exc.__class__.__name__}: {exc}")


async def collect_usgs() -> None:
    """Siklus rutin: window 24 jam (overlap aman — dedup menangani)."""
    await _collect_usgs_window(timedelta(hours=24), "24h")


async def collect_usgs_backfill() -> None:
    """Sekali saat startup: backfill historis untuk modul analytics."""
    settings = get_settings()
    await _collect_usgs_window(
        timedelta(days=settings.usgs_backfill_days),
        f"backfill-{settings.usgs_backfill_days}d",
    )


async def collect_weather() -> None:
    provider = get_weather_provider()
    source_names = list(provider.source_names) or ["open-meteo-weather"]
    t0 = perf_counter()
    try:
        async with AsyncSessionLocal() as session:
            locations = (
                await session.scalars(sa.select(Location).where(Location.is_primary))
            ).all()
        if not locations:
            logger.info("weather: belum ada lokasi primer — jalankan scripts/seed.py")
            return
        batches = await provider.fetch_batch(locations)
        async with AsyncSessionLocal() as session:
            w_count, r_count = await ingest_observations(session, batches)
        latency = int((perf_counter() - t0) * 1000)
        await _mark(source_names, ok=True, latency_ms=latency)
        logger.info(
            "weather: %d lokasi → %d weather, %d rainfall (%dms)",
            len(locations), w_count, r_count, latency,
        )
        if w_count or r_count:
            bus.publish("weather.update", {"weather": w_count, "rainfall": r_count})
    except Exception as exc:
        logger.warning("weather gagal: %s: %s", exc.__class__.__name__, exc)
        await _mark(source_names, ok=False, error=f"{exc.__class__.__name__}: {exc}")
