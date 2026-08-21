"""ORM: weather_observations — observasi cuaca per lokasi per waktu."""

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class WeatherObservation(Base, TimestampMixin):
    __tablename__ = "weather_observations"
    __table_args__ = (
        # Query dominan: "observasi terbaru untuk lokasi X"
        sa.Index("ix_weather_location_observed", "location_id", "observed_at"),
        sa.CheckConstraint("humidity_pct BETWEEN 0 AND 100", name="humidity_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int] = mapped_column(
        sa.ForeignKey("locations.id", ondelete="CASCADE"), nullable=False
    )
    temperature_c: Mapped[float] = mapped_column(sa.Float, nullable=False)
    feels_like_c: Mapped[float | None] = mapped_column(sa.Float)
    humidity_pct: Mapped[float] = mapped_column(sa.Float, nullable=False)
    pressure_hpa: Mapped[float] = mapped_column(sa.Float, nullable=False)
    wind_speed_kmh: Mapped[float] = mapped_column(sa.Float, nullable=False)
    wind_direction_deg: Mapped[float | None] = mapped_column(sa.Float)
    visibility_km: Mapped[float | None] = mapped_column(sa.Float)
    cloud_cover_pct: Mapped[float | None] = mapped_column(sa.Float)
    precipitation_mm: Mapped[float] = mapped_column(sa.Float, default=0.0, nullable=False)
    condition_code: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    condition_text: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    uv_index: Mapped[float | None] = mapped_column(sa.Float)
    observed_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(sa.String(50), nullable=False)
