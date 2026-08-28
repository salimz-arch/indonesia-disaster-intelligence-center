"""Open-Meteo provider — cuaca current + presipitasi hourly, batch multi-lokasi.

Satu request untuk semua lokasi. timezone=UTC → semua timestamp sudah UTC
(konsisten dengan kebijakan database).
"""

import logging
from collections.abc import Sequence
from datetime import UTC, datetime

from pydantic import ValidationError

from app.providers.base import LocationRef, WeatherProvider, fetch_json
from app.schemas.observation import LocationObservation
from app.schemas.rainfall import RainfallObservationCreate
from app.schemas.weather import WeatherCondition, WeatherObservationCreate

logger = logging.getLogger("app.providers.open_meteo")

CURRENT_FIELDS = (
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,"
    "weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index"
)

_WMO_CONDITION: dict[int, WeatherCondition] = {
    0: WeatherCondition.CLEAR,
    1: WeatherCondition.CLEAR,
    2: WeatherCondition.PARTLY_CLOUDY,
    3: WeatherCondition.CLOUDY,
    45: WeatherCondition.FOG,
    48: WeatherCondition.FOG,
    51: WeatherCondition.DRIZZLE,
    53: WeatherCondition.DRIZZLE,
    55: WeatherCondition.DRIZZLE,
    56: WeatherCondition.DRIZZLE,
    57: WeatherCondition.DRIZZLE,
    61: WeatherCondition.RAIN,
    63: WeatherCondition.RAIN,
    65: WeatherCondition.HEAVY_RAIN,
    66: WeatherCondition.RAIN,
    67: WeatherCondition.HEAVY_RAIN,
    71: WeatherCondition.EXTREME,
    73: WeatherCondition.EXTREME,
    75: WeatherCondition.EXTREME,
    77: WeatherCondition.EXTREME,
    80: WeatherCondition.RAIN,
    81: WeatherCondition.RAIN,
    82: WeatherCondition.HEAVY_RAIN,
    85: WeatherCondition.EXTREME,
    86: WeatherCondition.EXTREME,
    95: WeatherCondition.THUNDERSTORM,
    96: WeatherCondition.THUNDERSTORM,
    99: WeatherCondition.THUNDERSTORM,
}

_CONDITION_TEXT: dict[WeatherCondition, str] = {
    WeatherCondition.CLEAR: "Clear",
    WeatherCondition.PARTLY_CLOUDY: "Partly Cloudy",
    WeatherCondition.CLOUDY: "Cloudy",
    WeatherCondition.FOG: "Fog",
    WeatherCondition.DRIZZLE: "Drizzle",
    WeatherCondition.RAIN: "Rain",
    WeatherCondition.HEAVY_RAIN: "Heavy Rain",
    WeatherCondition.THUNDERSTORM: "Thunderstorm",
    WeatherCondition.EXTREME: "Extreme Weather",
    WeatherCondition.UNKNOWN: "Unknown",
}


def wmo_to_condition(code: int) -> WeatherCondition:
    return _WMO_CONDITION.get(code, WeatherCondition.UNKNOWN)


def rainfall_from_hourly(
    hourly: dict, current_time: datetime
) -> tuple[float, float | None, float | None] | None:
    """Jumlahkan presipitasi hourly → (1j, 6j, 24j). None jika data tak ada.

    Semua time dianggap UTC (request memakai timezone=UTC).
    """
    times = hourly.get("time") or []
    values = hourly.get("precipitation") or []
    if not times or len(times) != len(values):
        return None
    now_hour = current_time.replace(minute=0, second=0, microsecond=0, tzinfo=None)
    idx = None
    for i, t in enumerate(times):
        if datetime.fromisoformat(t) > now_hour:
            break
        idx = i
    if idx is None:
        return None
    vals = [float(v) if v is not None else 0.0 for v in values]
    return (
        vals[idx],
        sum(vals[max(0, idx - 5) : idx + 1]),
        sum(vals[max(0, idx - 23) : idx + 1]),
    )


def _opt_float(value: object) -> float | None:
    return float(value) if value is not None else None


def parse_location_payload(payload: dict, location_id: int) -> LocationObservation | None:
    try:
        current = payload["current"]
        observed = datetime.fromisoformat(current["time"]).replace(tzinfo=UTC)
        condition = wmo_to_condition(int(current.get("weather_code", -1)))
        weather = WeatherObservationCreate(
            location_id=location_id,
            temperature_c=float(current["temperature_2m"]),
            feels_like_c=_opt_float(current.get("apparent_temperature")),
            humidity_pct=float(current["relative_humidity_2m"]),
            pressure_hpa=float(current["pressure_msl"]),
            wind_speed_kmh=float(current["wind_speed_10m"]),
            wind_direction_deg=_opt_float(current.get("wind_direction_10m")),
            visibility_km=None,
            cloud_cover_pct=_opt_float(current.get("cloud_cover")),
            precipitation_mm=float(current.get("precipitation") or 0.0),
            condition_code=condition,
            condition_text=_CONDITION_TEXT[condition],
            uv_index=_opt_float(current.get("uv_index")),
            observed_at=observed,
            source="open-meteo",
        )
        rainfall = None
        sums = rainfall_from_hourly(payload.get("hourly") or {}, observed)
        if sums is not None:
            rainfall = RainfallObservationCreate(
                location_id=location_id,
                rainfall_1h_mm=sums[0],
                rainfall_6h_mm=sums[1],
                rainfall_24h_mm=sums[2],
                observed_at=observed,
                source="open-meteo",
            )
        return LocationObservation(location_id=location_id, weather=weather, rainfall=rainfall)
    except (KeyError, ValueError, TypeError, ValidationError) as exc:
        logger.warning("Open-Meteo payload invalid (location %s): %s", location_id, exc)
        return None


class OpenMeteoProvider(WeatherProvider):
    name = "open-meteo"
    source_names = ("open-meteo-weather", "open-meteo-rainfall")

    URL = "https://api.open-meteo.com/v1/forecast"

    async def fetch_batch(self, locations: Sequence[LocationRef]) -> list[LocationObservation]:
        if not locations:
            return []
        params = {
            "latitude": ",".join(f"{loc.latitude:.4f}" for loc in locations),
            "longitude": ",".join(f"{loc.longitude:.4f}" for loc in locations),
            "current": CURRENT_FIELDS,
            "hourly": "precipitation",
            "past_days": 2,
            "forecast_days": 1,
            "timezone": "UTC",
            "wind_speed_unit": "kmh",
        }
        payload = await fetch_json(self.URL, params=params)
        # Multi-lokasi → array; urutan hasil mengikuti urutan input
        items = payload if isinstance(payload, list) else [payload]
        results: list[LocationObservation] = []
        for loc, item in zip(locations, items, strict=False):
            parsed = parse_location_payload(item, loc.id)
            if parsed is not None:
                results.append(parsed)
        return results
