"""ORM: rainfall_observations — akumulasi hujan per lokasi per waktu."""
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class RainfallObservation(Base, TimestampMixin):
    __tablename__ = "rainfall_observations"
    __table_args__ = (
        sa.Index("ix_rainfall_location_observed", "location_id", "observed_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int] = mapped_column(
        sa.ForeignKey("locations.id", ondelete="CASCADE"), nullable=False
    )
    rainfall_1h_mm: Mapped[float] = mapped_column(sa.Float, nullable=False)
    rainfall_6h_mm: Mapped[float | None] = mapped_column(sa.Float)
    rainfall_24h_mm: Mapped[float | None] = mapped_column(sa.Float)
    observed_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
    source: Mapped[str] = mapped_column(sa.String(50), nullable=False)
