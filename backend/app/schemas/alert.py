"""Canonical alert schema."""
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from app.schemas.common import IndonesiaLatitude, IndonesiaLongitude, UTCDateTime
from app.schemas.enums import AlertLevel, EventType


class AlertCreate(BaseModel):
    event_type: EventType
    severity: AlertLevel
    title: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1)
    latitude: IndonesiaLatitude | None = None
    longitude: IndonesiaLongitude | None = None
    location_text: str | None = Field(None, max_length=255)
    triggered_at: UTCDateTime
    expires_at: UTCDateTime | None = None
    source: str = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def _expires_after_triggered(self) -> "AlertCreate":
        if self.expires_at is not None and self.expires_at <= self.triggered_at:
            raise ValueError("expires_at harus setelah triggered_at")
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
    expires_at: UTCDateTime | None
    source: str

    @computed_field
    @property
    def is_active(self) -> bool:
        return self.expires_at is None or self.expires_at > datetime.now(UTC)
