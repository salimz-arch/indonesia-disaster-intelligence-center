"""Import semua model — WAJIB untuk Alembic autogenerate & create_all."""

from app.models.ai_report import AIReport
from app.models.alert import Alert
from app.models.data_source import DataSource
from app.models.disaster import DisasterEvent
from app.models.earthquake import Earthquake
from app.models.location import Location
from app.models.rainfall import RainfallObservation
from app.models.weather import WeatherObservation

__all__ = [
    "AIReport",
    "Alert",
    "DataSource",
    "DisasterEvent",
    "Earthquake",
    "Location",
    "RainfallObservation",
    "WeatherObservation",
]
