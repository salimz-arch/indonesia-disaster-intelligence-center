"""Canonical earthquake schema — kontrak provider → service → API.

Kategori magnitude adalah kategori VISUAL INTERNAL aplikasi,
bukan klasifikasi resmi lembaga seismik apa pun.
"""
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.schemas.common import IndonesiaLatitude, IndonesiaLongitude, UTCDateTime
from app.schemas.enums import Severity


class MagnitudeCategory(StrEnum):
    LOW = "low"            # < 3.0
    MODERATE = "moderate"  # 3.0 - 3.9
    SIGNIFICANT = "significant"  # 4.0 - 4.9
    STRONG = "strong"      # 5.0 - 5.9
    MAJOR = "major"        # 6.0 - 6.9
    SEVERE = "severe"      # >= 7.0


_CATEGORY_TO_SEVERITY: dict[MagnitudeCategory, Severity] = {
    MagnitudeCategory.LOW: Severity.LOW,
    MagnitudeCategory.MODERATE: Severity.MODERATE,
    MagnitudeCategory.SIGNIFICANT: Severity.HIGH,
    MagnitudeCategory.STRONG: Severity.HIGH,
    MagnitudeCategory.MAJOR: Severity.CRITICAL,
    MagnitudeCategory.SEVERE: Severity.CRITICAL,
}


def magnitude_category(magnitude: float) -> MagnitudeCategory:
    """Kategori visual internal — bukan klasifikasi resmi."""
    if magnitude < 3.0:
        return MagnitudeCategory.LOW
    if magnitude < 4.0:
        return MagnitudeCategory.MODERATE
    if magnitude < 5.0:
        return MagnitudeCategory.SIGNIFICANT
    if magnitude < 6.0:
        return MagnitudeCategory.STRONG
    if magnitude < 7.0:
        return MagnitudeCategory.MAJOR
    return MagnitudeCategory.SEVERE


def magnitude_severity(magnitude: float) -> Severity:
    return _CATEGORY_TO_SEVERITY[magnitude_category(magnitude)]


class EarthquakeCreate(BaseModel):
    """Input canonical — output WAJIB dari setiap earthquake provider."""

    provider: str = Field(min_length=1, max_length=50)
    source_id: str = Field(min_length=1, max_length=100)
    magnitude: float = Field(ge=-1.0, le=10.5)
    depth_km: float = Field(ge=0, le=700)
    latitude: IndonesiaLatitude
    longitude: IndonesiaLongitude
    location_text: str | None = None
    region: str | None = Field(None, max_length=120)
    event_time: UTCDateTime
    potential_tsunami: bool = False


class EarthquakeRead(BaseModel):
    """Output API — dari ORM row, kategori & severity dihitung backend
    supaya frontend cukup satu sumber kebenaran."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    provider: str
    source_id: str
    magnitude: float
    depth_km: float
    latitude: float
    longitude: float
    location_text: str | None = None
    region: str | None = None
    event_time: UTCDateTime
    potential_tsunami: bool

    @computed_field
    @property
    def category(self) -> MagnitudeCategory:
        return magnitude_category(self.magnitude)

    @computed_field
    @property
    def severity(self) -> Severity:
        return magnitude_severity(self.magnitude)
