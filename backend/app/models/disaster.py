"""ORM: disaster_events — event bencana non-seismik (bila tersedia provider)."""
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DisasterEvent(Base, TimestampMixin):
    __tablename__ = "disaster_events"
    __table_args__ = (
        sa.Index("ix_disaster_occurred", "occurred_at"),
        sa.Index("ix_disaster_type", "event_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(sa.String(40), nullable=False)
    severity: Mapped[str] = mapped_column(sa.String(20), nullable=False)
    # Beberapa event bersifat regional tanpa koordinat spesifik
    latitude: Mapped[float | None] = mapped_column(sa.Float)
    longitude: Mapped[float | None] = mapped_column(sa.Float)
    location_text: Mapped[str | None] = mapped_column(sa.String(255))
    description: Mapped[str | None] = mapped_column(sa.Text)
    status: Mapped[str] = mapped_column(
        sa.String(30), default="active", nullable=False
    )
    source: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    # Untuk dedup future; belum di-uniqukan karena format id tiap provider berbeda
    source_id: Mapped[str | None] = mapped_column(sa.String(100))
    occurred_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
