"""Alert schemas."""
from pydantic import BaseModel, ConfigDict, Field

# ✅ PASTIKAN UTCTimestamp DI-IMPORT DI SINI
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
    triggered_at: UTCDateTime          # Waktu kejadian: HARUS masa lalu/sekarang
    expires_at: UTCTimestamp | None = None  # ✅ Waktu kadaluarsa: BOLEH masa depan
    source: str = Field(min_length=1, max_length=50)
    source_id: str | None = None


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
    triggered_at: UTCDateTime          # Waktu kejadian: HARUS masa lalu/sekarang
    expires_at: UTCTimestamp | None    # ✅ Waktu kadaluarsa: BOLEH masa depan
    source: str
    source_id: str | None
