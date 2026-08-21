"""ORM: data_sources — registry + status tiap sumber data eksternal."""

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DataSource(Base, TimestampMixin):
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(sa.String(100), unique=True, nullable=False)
    # earthquake | weather | rainfall | map | ai
    category: Mapped[str] = mapped_column(sa.String(40), nullable=False)
    # online | degraded | offline | unknown — di-update collector (Step 5)
    status: Mapped[str] = mapped_column(sa.String(20), default="unknown", nullable=False)
    description: Mapped[str | None] = mapped_column(sa.String(255))
    last_success_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(sa.Text)
    refresh_seconds: Mapped[int] = mapped_column(default=0, nullable=False)
    latency_ms: Mapped[int | None] = mapped_column(sa.Integer)
