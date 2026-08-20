"""Canonical rainfall schema — kontrak provider → service → API."""
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.schemas.common import UTCDateTime


class RainfallIntensity(StrEnum):
    """Intensitas hujan (mm/jam) — kategori visual internal."""

    NONE = "none"          # 0
    LIGHT = "light"        # <= 1
    MODERATE = "moderate"  # <= 5
    HEAVY = "heavy"        # <= 10
    VERY_HEAVY = "very_heavy"  # <= 20
    EXTREME = "extreme"    # > 20


def rainfall_intensity(mm_per_hour: float) -> RainfallIntensity:
    if mm_per_hour <= 0:
        return RainfallIntensity.NONE
    if mm_per_hour <= 1:
        return RainfallIntensity.LIGHT
    if mm_per_hour <= 5:
        return RainfallIntensity.MODERATE
    if mm_per_hour <= 10:
        return RainfallIntensity.HEAVY
    if mm_per_hour <= 20:
        return RainfallIntensity.VERY_HEAVY
    return RainfallIntensity.EXTREME


class RainfallObservationCreate(BaseModel):
    location_id: int
    rainfall_1h_mm: float = Field(ge=0, le=500)
    rainfall_6h_mm: float | None = Field(None, ge=0, le=1500)
    rainfall_24h_mm: float | None = Field(None, ge=0, le=3000)
    observed_at: UTCDateTime
    source: str = Field(min_length=1, max_length=50)


class RainfallObservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    location_id: int
    rainfall_1h_mm: float
    rainfall_6h_mm: float | None
    rainfall_24h_mm: float | None
    observed_at: UTCDateTime
    source: str

    @computed_field
    @property
    def intensity(self) -> RainfallIntensity:
        return rainfall_intensity(self.rainfall_1h_mm)
