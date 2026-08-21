"""Rainfall service — query observasi hujan terbaru per lokasi."""
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Location, RainfallObservation
from app.schemas.rainfall import RainfallObservationRead


async def get_latest_for_location(
    session: AsyncSession, location_id: int
) -> RainfallObservationRead | None:
    stmt = (
        sa.select(RainfallObservation)
        .where(RainfallObservation.location_id == location_id)
        .order_by(RainfallObservation.observed_at.desc())
        .limit(1)
    )
    row = (await session.scalars(stmt)).first()
    return RainfallObservationRead.model_validate(row) if row else None


async def get_latest_all(session: AsyncSession) -> list[RainfallObservationRead]:
    loc_ids = list(
        (await session.scalars(sa.select(Location.id).where(Location.is_primary))).all()
    )
    results = []
    for loc_id in loc_ids:
        item = await get_latest_for_location(session, loc_id)
        if item is not None:
            results.append(item)
    return results
