"""Source service — status kesehatan tiap data source (halaman transparency §40)."""
from datetime import UTC, datetime

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DataSource
from app.realtime.bus import bus
from app.schemas.data_source import DataSourceRead


async def mark_success(session: AsyncSession, name: str, latency_ms: int) -> None:
    await session.execute(
        sa.update(DataSource)
        .where(DataSource.name == name)
        .values(
            status="online",
            last_success_at=datetime.now(UTC),
            latency_ms=latency_ms,
            last_error=None,
        )
    )
    await session.commit()
    bus.publish("source.status", {"name": name, "status": "online", "latency_ms": latency_ms})



async def mark_failure(session: AsyncSession, name: str, error: str) -> None:
    await session.execute(
        sa.update(DataSource)
        .where(DataSource.name == name)
        .values(status="degraded", last_error=error[:500])
    )
    await session.commit()
    bus.publish("source.status", {"name": name, "status": "degraded"})


async def list_sources(session: AsyncSession) -> list[DataSourceRead]:
    rows = (
        await session.scalars(
            sa.select(DataSource).order_by(DataSource.category, DataSource.name)
        )
    ).all()
    return [DataSourceRead.model_validate(row) for row in rows]
