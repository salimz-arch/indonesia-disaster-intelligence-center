"""Location service — daftar lokasi pantau (untuk search & flyTo frontend §22)."""

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Location
from app.schemas.location import LocationRead


async def list_locations(session: AsyncSession) -> list[LocationRead]:
    rows = (await session.scalars(sa.select(Location).order_by(Location.name))).all()
    return [LocationRead.model_validate(row) for row in rows]
