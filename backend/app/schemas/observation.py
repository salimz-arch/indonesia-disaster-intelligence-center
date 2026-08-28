"""DTO batch observasi per lokasi — jembatan provider → service."""

from dataclasses import dataclass

from app.schemas.rainfall import RainfallObservationCreate
from app.schemas.weather import WeatherObservationCreate


@dataclass(slots=True)
class LocationObservation:
    location_id: int
    weather: WeatherObservationCreate
    rainfall: RainfallObservationCreate | None
