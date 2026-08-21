"""ORM: alerts — peringatan aktif (dari provider resmi atau internal rules)."""

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"
    __table_args__ = (
        sa.Index("ix_alerts_triggered", "triggered_at"),
        sa.Index("ix_alerts_severity", "severity"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(sa.String(40), nullable=False)
    severity: Mapped[str] = mapped_column(sa.String(20), nullable=False)
    title: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    message: Mapped[str] = mapped_column(sa.Text, nullable=False)
    latitude: Mapped[float | None] = mapped_column(sa.Float)
    longitude: Mapped[float | None] = mapped_column(sa.Float)
    location_text: Mapped[str | None] = mapped_column(sa.String(255))
    triggered_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    source: Mapped[str] = mapped_column(sa.String(50), nullable=False)
    source_id: Mapped[str | None] = mapped_column(sa.String(100))
