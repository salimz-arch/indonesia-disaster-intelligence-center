"""Canonical disaster event schema."""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import IndonesiaLatitude, IndonesiaLongitude, UTCDateTime
from app.schemas.enums import EventType, Severity


class DisasterEventCreate(BaseModel):
    event_type: EventType
    severity: Severity
    latitude: IndonesiaLatitude | None = None
    longitude: IndonesiaLongitude | None = None
    location_text: str | None = Field(None, max_length=255)
    description: str | None = None
    status: str = Field(default="active", max_length=30)
    source: str = Field(min_length=1, max_length=50)
    source_id: str | None = Field(None, max_length=100)
    occurred_at: UTCDateTime


class DisasterEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: EventType
    severity: Severity
    latitude: float | None
    longitude: float | None
    location_text: str | None
    description: str | None
    status: str
    source: str
    source_id: str | None
    occurred_at: UTCDateTime
