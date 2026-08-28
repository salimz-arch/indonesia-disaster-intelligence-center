"""Jalankan pipeline ingestion SATU KALI di foreground — alat diagnosis.

Semua error tampil langsung di console, terpisah dari scheduler.
Jalankan dari backend/ (venv aktif):  python scripts/ingest_once.py
"""

import asyncio
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from time import perf_counter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sqlalchemy as sa

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.models import Location
from app.providers import get_bmkg_provider, get_usgs_provider, get_weather_provider
from app.services.earthquake_service import ingest_earthquakes
from app.services.source_service import mark_failure, mark_success
from app.services.weather_service import ingest_observations

SRC_BMKG = "bmkg-earthquake"
SRC_USGS = "usgs-earthquake"
SRC_WEATHER = ["open-meteo-weather", "open-meteo-rainfall"]


async def _try(session, label, source_names, fn):
    print(f"\n=== {label} ===")
    t0 = perf_counter()
    try:
        outcome = await fn(session)
        ms = int((perf_counter() - t0) * 1000)
        for name in [source_names] if isinstance(source_names, str) else source_names:
            await mark_success(session, name, ms)
        print(f"  SUKSES ({ms}ms): {outcome}")
    except Exception as exc:
        for name in [source_names] if isinstance(source_names, str) else source_names:
            await mark_failure(session, name, f"{exc.__class__.__name__}: {exc}")
        print(f"  GAGAL: {exc.__class__.__name__}: {exc}")


async def main() -> None:
    settings = get_settings()
    print(f"mode data: {settings.data_mode}")

    async with AsyncSessionLocal() as session:

        async def bmkg_job(s):
            events = await get_bmkg_provider().fetch()
            r = await ingest_earthquakes(s, events)
            return (
                f"fetch={len(events)} → inserted={r.inserted}, "
                f"dup={r.duplicate}, similar={r.similar}"
            )

        async def usgs_job(s):
            provider = get_usgs_provider()
            if provider is None:
                return "skip (mock mode)"
            end = datetime.now(UTC)
            events = await provider.fetch_window(
                end - timedelta(days=settings.usgs_backfill_days), end
            )
            r = await ingest_earthquakes(s, events)
            return (
                f"backfill {settings.usgs_backfill_days}d: fetch={len(events)} → "
                f"inserted={r.inserted}, dup={r.duplicate}, similar={r.similar}"
            )

        async def weather_job(s):
            locations = (await s.scalars(sa.select(Location).where(Location.is_primary))).all()
            batches = await get_weather_provider().fetch_batch(locations)
            w, r = await ingest_observations(s, batches)
            return f"{len(locations)} lokasi → weather={w}, rainfall={r}"

        await _try(session, "1/3 BMKG realtime", SRC_BMKG, bmkg_job)
        await _try(session, "2/3 USGS backfill", SRC_USGS, usgs_job)
        await _try(session, "3/3 Open-Meteo", SRC_WEATHER, weather_job)

    print("\nVerifikasi:")
    print("  curl http://localhost:8000/api/v1/earthquakes/latest")
    print("  curl http://localhost:8000/api/v1/weather")
    print("  curl http://localhost:8000/api/v1/sources")


if __name__ == "__main__":
    asyncio.run(main())
