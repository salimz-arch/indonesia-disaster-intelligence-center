"""Enum domain — divalidasi Pydantic di boundary, disimpan sebagai string."""
from enum import StrEnum


class EventType(StrEnum):
    EARTHQUAKE = "earthquake"
    HEAVY_RAIN = "heavy_rain"
    FLOOD = "flood"
    LANDSLIDE = "landslide"
    STORM = "storm"
    TSUNAMI = "tsunami"
    EXTREME_WEATHER = "extreme_weather"
    FOREST_FIRE = "forest_fire"


class Severity(StrEnum):
    """Severity event — juga dipakai filter map (§21)."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class AlertLevel(StrEnum):
    """Level alert system (§13)."""
    NORMAL = "normal"
    WATCH = "watch"
    WARNING = "warning"
    CRITICAL = "critical"


class SourceStatus(StrEnum):
    ONLINE = "online"
    DEGRADED = "degraded"
    OFFLINE = "offline"
    UNKNOWN = "unknown"
