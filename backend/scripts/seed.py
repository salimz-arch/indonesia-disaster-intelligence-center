"""Seed IDIC — lokasi primer Indonesia + registrasi data sources.

Idempoten: aman dijalankan berulang. Jalankan dari backend/:
    python scripts/seed.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.models import DataSource, Location

# name, region, latitude, longitude, timezone, is_primary
LOCATIONS = [
    ("Banda Aceh", "Aceh", 5.5483, 95.3238, "Asia/Jakarta", True),
    ("Medan", "Sumatera Utara", 3.5952, 98.6722, "Asia/Jakarta", True),
    ("Padang", "Sumatera Barat", -0.9471, 100.4172, "Asia/Jakarta", True),
    ("Palembang", "Sumatera Selatan", -2.9761, 104.7754, "Asia/Jakarta", True),
    ("Jakarta", "DKI Jakarta", -6.2088, 106.8456, "Asia/Jakarta", True),
    ("Bandung", "Jawa Barat", -6.9175, 107.6191, "Asia/Jakarta", True),
    ("Semarang", "Jawa Tengah", -6.9667, 110.4167, "Asia/Jakarta", True),
    ("Yogyakarta", "DI Yogyakarta", -7.7956, 110.3695, "Asia/Jakarta", True),
    ("Surabaya", "Jawa Timur", -7.2575, 112.7521, "Asia/Jakarta", True),
    ("Denpasar", "Bali", -8.6705, 115.2126, "Asia/Makassar", True),
    ("Pontianak", "Kalimantan Barat", -0.0263, 109.3425, "Asia/Makassar", True),
    ("Balikpapan", "Kalimantan Timur", -1.2379, 116.8529, "Asia/Makassar", True),
    ("Makassar", "Sulawesi Selatan", -5.1477, 119.4327, "Asia/Makassar", True),
    ("Manado", "Sulawesi Utara", 1.4748, 124.8421, "Asia/Makassar", True),
    ("Ambon", "Maluku", -3.6954, 128.1814, "Asia/Jayapura", True),
    ("Jayapura", "Papua", -2.5916, 140.6690, "Asia/Jayapura", True),
]

# name, category, refresh_seconds, description
DATA_SOURCES = [
    ("bmkg-earthquake", "earthquake", 60, "BMKG TEWS — gempa bumi realtime"),
    ("usgs-earthquake", "earthquake", 300, "USGS FDSN — gempa historis & fallback"),
    ("open-meteo-weather", "weather", 600, "Open-Meteo — cuaca current & hourly"),
    ("open-meteo-rainfall", "rainfall", 900, "Open-Meteo — presipitasi per lokasi"),
    ("rainviewer-radar", "map", 600, "RainViewer — tile radar hujan"),
    ("ai-provider", "ai", 0, "LLM situation analysis provider"),
]


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async with session_maker() as session:
        existing_locations = set(await session.scalars(sa.select(Location.name)))
        new_locations = [
            Location(
                name=name,
                region=region,
                latitude=lat,
                longitude=lon,
                timezone=tz,
                is_primary=is_primary,
            )
            for name, region, lat, lon, tz, is_primary in LOCATIONS
            if name not in existing_locations
        ]
        session.add_all(new_locations)

        existing_sources = set(await session.scalars(sa.select(DataSource.name)))
        new_sources = [
            DataSource(
                name=name,
                category=category,
                refresh_seconds=refresh,
                description=description,
            )
            for name, category, refresh, description in DATA_SOURCES
            if name not in existing_sources
        ]
        session.add_all(new_sources)

        await session.commit()

    await engine.dispose()
    print(
        f"Seed selesai: +{len(new_locations)} lokasi, "
        f"+{len(new_sources)} data sources "
        f"(sudah ada: {len(existing_locations)} lokasi, "
        f"{len(existing_sources)} sources)"
    )


if __name__ == "__main__":
    asyncio.run(main())
