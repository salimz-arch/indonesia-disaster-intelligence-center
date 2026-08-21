"""Weather service — ingest observasi + query terbaru per lokasi."""
import logging
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Location, RainfallObservation, WeatherObservation
from app.schemas.observation import LocationObservation
from app.schemas.weather import WeatherObservationRead

logger = logging.getLogger("app.services.weather")


async def ingest_observations(
    session: AsyncSession, batches: Sequence[LocationObservation]
) -> tuple[int, int]:
    """Simpan observasi cuaca + rainfall. Return (jumlah_weather, jumlah_rainfall)."""
    weather_count = rainfall_count = 0
    for batch in batches:
        session.add(WeatherObservation(**batch.weather.model_dump()))
        weather_count += 1
        if batch.rainfall is not None:
            session.add(RainfallObservation(**batch.rainfall.model_dump()))
            rainfall_count += 1
    if batches:
        await session.commit()
    return weather_count, rainfall_count


async def get_latest_for_location(
    session: AsyncSession, location_id: int
) -> WeatherObservationRead | None:
    stmt = (
        sa.select(WeatherObservation)
        .where(WeatherObservation.location_id == location_id)
        .order_by(WeatherObservation.observed_at.desc())
        .limit(1)
    )
    row = (await session.scalars(stmt)).first()
    return WeatherObservationRead.model_validate(row) if row else None


async def get_latest_all(session: AsyncSession) -> list[WeatherObservationRead]:
    """Observasi terbaru untuk tiap lokasi primer."""
    loc_ids = list(
        (await session.scalars(sa.select(Location.id).where(Location.is_primary))).all()
    )
    results = []
    for loc_id in loc_ids:
        item = await get_latest_for_location(session, loc_id)
        if item is not None:
            results.append(item)
    return results
