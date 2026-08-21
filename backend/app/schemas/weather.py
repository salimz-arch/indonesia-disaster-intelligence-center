"""Canonical weather schema — kontrak provider → service → API."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import UTCDateTime


class WeatherCondition(StrEnum):
    """Kondisi cuaca internal — provider memetakan dari kode WMO/proprietary."""

    CLEAR = "clear"
    PARTLY_CLOUDY = "partly_cloudy"
    CLOUDY = "cloudy"
    FOG = "fog"
    DRIZZLE = "drizzle"
    RAIN = "rain"
    HEAVY_RAIN = "heavy_rain"
    THUNDERSTORM = "thunderstorm"
    EXTREME = "extreme"
    UNKNOWN = "unknown"


class WeatherSnapshot(BaseModel):
    """Observasi cuaca canonical TANPA lokasi — dipakai live-fetch
    (koordinat bebas) dan sebagai basis Create/Read."""

    temperature_c: float = Field(ge=-20, le=60)
    feels_like_c: float | None = Field(None, ge=-30, le=70)
    humidity_pct: float = Field(ge=0, le=100)
    pressure_hpa: float = Field(ge=850, le=1100)
    wind_speed_kmh: float = Field(ge=0, le=300)
    wind_direction_deg: float | None = Field(None, ge=0, le=360)
    visibility_km: float | None = Field(None, ge=0, le=100)
    cloud_cover_pct: float | None = Field(None, ge=0, le=100)
    precipitation_mm: float = Field(default=0, ge=0)
    condition_code: WeatherCondition
    condition_text: str = Field(min_length=1, max_length=255)
    uv_index: float | None = Field(None, ge=0, le=15)
    observed_at: UTCDateTime
    source: str = Field(min_length=1, max_length=50)


class WeatherObservationCreate(WeatherSnapshot):
    location_id: int


class WeatherObservationRead(WeatherSnapshot):
    model_config = ConfigDict(from_attributes=True)

    id: int
    location_id: int
