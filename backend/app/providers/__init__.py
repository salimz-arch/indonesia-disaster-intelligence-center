"""Provider factories — satu-satunya tempat memilih provider live vs mock."""

from app.core.config import get_settings
from app.providers.base import EarthquakeProvider, WeatherProvider
from app.providers.bmkg import BMKGEarthquakeProvider
from app.providers.mock import MockEarthquakeProvider, MockWeatherProvider
from app.providers.open_meteo import OpenMeteoProvider
from app.providers.usgs import USGSEarthquakeProvider


def get_bmkg_provider() -> EarthquakeProvider:
    if get_settings().data_mode == "mock":
        return MockEarthquakeProvider()
    return BMKGEarthquakeProvider()


def get_usgs_provider() -> EarthquakeProvider | None:
    if get_settings().data_mode == "mock":
        return None  # gempa mock sudah dicover MockEarthquakeProvider
    return USGSEarthquakeProvider()


def get_weather_provider() -> WeatherProvider:
    if get_settings().data_mode == "mock":
        return MockWeatherProvider()
    return OpenMeteoProvider()
