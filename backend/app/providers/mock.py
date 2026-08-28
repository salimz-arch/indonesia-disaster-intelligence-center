"""Mock providers untuk development offline — DATA PALSU, berlabel jelas.

Aktif hanya saat DATA_MODE=mock. provider/source = "mock" agar terlihat
beda dari data live di API.
"""

import asyncio
import json
import logging
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.providers.base import EarthquakeProvider, LocationRef, WeatherProvider
from app.schemas.earthquake import EarthquakeCreate
from app.schemas.observation import LocationObservation
from app.schemas.rainfall import RainfallObservationCreate
from app.schemas.weather import WeatherCondition, WeatherObservationCreate

logger = logging.getLogger("app.providers.mock")

MOCK_DIR = Path(__file__).resolve().parent.parent.parent / "mock_data"


async def _read_mock(filename: str) -> dict:
    path = MOCK_DIR / filename
    raw = await asyncio.to_thread(path.read_text, encoding="utf-8")
    return json.loads(raw)


class MockEarthquakeProvider(EarthquakeProvider):
    name = "mock-earthquake"

    def __init__(self) -> None:
        logger.warning("MOCK MODE — earthquake provider memakai DATA PALSU")

    async def fetch(self) -> list[EarthquakeCreate]:
        payload = await _read_mock("mock_earthquakes.json")
        now = datetime.now(UTC)
        events = []
        for i, e in enumerate(payload["events"]):
            events.append(
                EarthquakeCreate(
                    provider="mock",
                    source_id=f"mock-{i:03d}",
                    magnitude=e["magnitude"],
                    depth_km=e["depth_km"],
                    latitude=e["latitude"],
                    longitude=e["longitude"],
                    location_text=e.get("location_text"),
                    event_time=now - timedelta(minutes=e["minutes_ago"]),
                    potential_tsunami=e.get("potential_tsunami", False),
                )
            )
        return events


class MockWeatherProvider(WeatherProvider):
    name = "mock-weather"
    source_names = ("mock-weather", "mock-rainfall")

    def __init__(self) -> None:
        logger.warning("MOCK MODE — weather provider memakai DATA PALSU")

    async def fetch_batch(self, locations: Sequence[LocationRef]) -> list[LocationObservation]:
        payload = await _read_mock("mock_weather.json")
        default = payload["default"]
        overrides = payload.get("locations", {})
        now = datetime.now(UTC)
        results = []
        for loc in locations:
            cfg = {**default, **overrides.get(loc.name, {})}
            condition = WeatherCondition(cfg["condition_code"])
            weather = WeatherObservationCreate(
                location_id=loc.id,
                temperature_c=cfg["temperature_c"],
                feels_like_c=cfg.get("feels_like_c"),
                humidity_pct=cfg["humidity_pct"],
                pressure_hpa=cfg["pressure_hpa"],
                wind_speed_kmh=cfg["wind_speed_kmh"],
                wind_direction_deg=cfg.get("wind_direction_deg"),
                cloud_cover_pct=cfg.get("cloud_cover_pct"),
                precipitation_mm=cfg.get("precipitation_mm", 0.0),
                condition_code=condition,
                condition_text=f"Mock: {condition.value}",
                uv_index=cfg.get("uv_index"),
                observed_at=now,
                source="mock",
            )
            rainfall = RainfallObservationCreate(
                location_id=loc.id,
                rainfall_1h_mm=cfg.get("rainfall_1h_mm", 0.0),
                rainfall_6h_mm=cfg.get("rainfall_6h_mm"),
                rainfall_24h_mm=cfg.get("rainfall_24h_mm"),
                observed_at=now,
                source="mock",
            )
            results.append(
                LocationObservation(location_id=loc.id, weather=weather, rainfall=rainfall)
            )
        return results
