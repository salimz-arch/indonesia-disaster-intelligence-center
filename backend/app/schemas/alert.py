"""Alert schemas."""
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.common import (
    UTCDateTime,
    UTCTimestamp,
)
from app.schemas.enums import AlertLevel, EventType


class AlertCreate(BaseModel):
    event_type: EventType
    severity: AlertLevel
    title: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=10, max_length=1000)
    latitude: float | None = None
    longitude: float | None = None
    location_text: str | None = None
    triggered_at: UTCDateTime
    expires_at: UTCTimestamp | None = None
    source: str = Field(min_length=1, max_length=50)
    source_id: str | None = None

    @model_validator(mode="after")
    def validate_expires_after_triggered(self) -> "AlertCreate":
        """expires_at HARUS lebih besar dari triggered_at."""
        if self.expires_at is not None and self.expires_at <= self.triggered_at:
            raise ValueError("expires_at harus lebih besar dari triggered_at")
        return self


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: EventType
    severity: AlertLevel
    title: str
    message: str
    latitude: float | None
    longitude: float | None
    location_text: str | None
    triggered_at: UTCDateTime
    expires_at: UTCTimestamp | None
    source: str
    source_id: str | None

    @property
    def is_active(self) -> bool:
        """Alert aktif jika expires_at null atau masih di masa depan."""
        if self.expires_at is None:
            return True
        return self.expires_at > datetime.now(UTC)
