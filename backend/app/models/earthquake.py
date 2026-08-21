"""ORM: earthquakes — event seismik canonical dari provider manapun."""

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Earthquake(Base, TimestampMixin):
    __tablename__ = "earthquakes"
    __table_args__ = (
        # Dedup garansi DB: satu event = satu baris per provider
        sa.UniqueConstraint(
            "provider",
            "source_id",
            name="uq_earthquakes_provider_source_id",
        ),
        sa.CheckConstraint("magnitude BETWEEN -1.0 AND 10.5", name="magnitude_range"),
        sa.CheckConstraint("depth_km BETWEEN 0 AND 700", name="depth_range"),
        # Query dominan: "event terbaru" dan "filter magnitude"
        sa.Index("ix_earthquakes_event_time", "event_time"),
        sa.Index("ix_earthquakes_magnitude", "magnitude"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    source_id: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    magnitude: Mapped[float] = mapped_column(sa.Float, nullable=False)
    depth_km: Mapped[float] = mapped_column(sa.Float, nullable=False)
    latitude: Mapped[float] = mapped_column(sa.Float, nullable=False)
    longitude: Mapped[float] = mapped_column(sa.Float, nullable=False)
    location_text: Mapped[str | None] = mapped_column(sa.Text)
    region: Mapped[str | None] = mapped_column(sa.String(120))
    event_time: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    potential_tsunami: Mapped[bool] = mapped_column(default=False, nullable=False)
