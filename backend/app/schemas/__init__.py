"""Canonical schemas — kontrak antar layer (provider → service → API)."""

from app.schemas.ai_report import AIReportCreate, AIReportRead, RiskLevel, risk_level
from app.schemas.alert import AlertCreate, AlertRead
from app.schemas.data_source import DataSourceRead
from app.schemas.disaster import DisasterEventCreate, DisasterEventRead
from app.schemas.earthquake import (
    EarthquakeCreate,
    EarthquakeRead,
    MagnitudeCategory,
    magnitude_category,
    magnitude_severity,
)
from app.schemas.enums import AlertLevel, EventType, Severity, SourceStatus
from app.schemas.location import LocationCreate, LocationRead
from app.schemas.rainfall import (
    RainfallIntensity,
    RainfallObservationCreate,
    RainfallObservationRead,
    RainfallSnapshot,  # tambahan
    rainfall_intensity,
)
from app.schemas.weather import (
    WeatherCondition,
    WeatherObservationCreate,
    WeatherObservationRead,
    WeatherSnapshot,
)

__all__ = [
    "AIReportCreate",
    "AIReportRead",
    "AlertCreate",
    "AlertLevel",
    "AlertRead",
    "DataSourceRead",
    "DisasterEventCreate",
    "DisasterEventRead",
    "EarthquakeCreate",
    "EarthquakeRead",
    "EventType",
    "LocationCreate",
    "LocationRead",
    "MagnitudeCategory",
    "RainfallIntensity",
    "RainfallObservationCreate",
    "RainfallObservationRead",
    "RainfallSnapshot",
    "RiskLevel",
    "Severity",
    "SourceStatus",
    "WeatherCondition",
    "WeatherObservationCreate",
    "WeatherObservationRead",
    "WeatherSnapshot",
    "magnitude_category",
    "magnitude_severity",
    "rainfall_intensity",
    "risk_level",
]
