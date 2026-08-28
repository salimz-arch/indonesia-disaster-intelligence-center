"""Unit test parser provider — tanpa network, fixture inline."""

from datetime import UTC, datetime, timedelta

from app.providers.bmkg import parse_gempa
from app.providers.open_meteo import rainfall_from_hourly, wmo_to_condition
from app.providers.usgs import parse_feature
from app.schemas.weather import WeatherCondition

# ── BMKG ──


def _bmkg_raw(**overrides) -> dict:
    base = {
        "Tanggal": "19 Agu 2026",
        "Jam": "14:30:15 WIB",
        "DateTime": (datetime.now(UTC) - timedelta(minutes=30)).isoformat(),
        "Coordinates": "3.59,98.67",
        "Magnitude": "5.1",
        "Kedalaman": "35 km",
        "Wilayah": "Pusat gempa di darat 12 km TL Tapanuli Utara",
        "Potensi": "tidak berpotensi TSUNAMI",
    }
    base.update(overrides)
    return base


def test_parse_gempa_valid():
    ev = parse_gempa(_bmkg_raw())
    assert ev is not None
    assert ev.provider == "bmkg"
    assert ev.magnitude == 5.1
    assert ev.latitude == 3.59
    assert ev.longitude == 98.67
    assert ev.depth_km == 35.0
    assert ev.potential_tsunami is False


def test_parse_gempa_tsunami_positive():
    ev = parse_gempa(_bmkg_raw(Potensi="berpotensi TSUNAMI"))
    assert ev is not None
    assert ev.potential_tsunami is True


def test_parse_gempa_invalid_magnitude_returns_none():
    assert parse_gempa(_bmkg_raw(Magnitude="tidak-valid")) is None


def test_parse_gempa_missing_coordinates_returns_none():
    raw = _bmkg_raw()
    del raw["Coordinates"]
    assert parse_gempa(raw) is None


# ── USGS ──


def _usgs_feature(**overrides) -> dict:
    now_ms = int((datetime.now(UTC) - timedelta(minutes=30)).timestamp() * 1000)
    base = {
        "id": "us7000abcd",
        "properties": {
            "mag": 4.8,
            "place": "120 km SW of Ternate, Indonesia",
            "time": now_ms,
            "tsunami": 0,
        },
        "geometry": {"type": "Point", "coordinates": [126.85, 0.65, 34]},
    }
    for key, value in overrides.items():
        base[key] = value
    return base


def test_parse_usgs_feature_coordinates_order():
    """GeoJSON [lon, lat, depth] — WAJIB tidak kebalik."""
    ev = parse_feature(_usgs_feature())
    assert ev is not None
    assert ev.provider == "usgs"
    assert ev.longitude == 126.85
    assert ev.latitude == 0.65
    assert ev.depth_km == 34
    assert ev.source_id == "us7000abcd"


def test_parse_usgs_feature_without_magnitude_returns_none():
    feature = _usgs_feature()
    feature["properties"]["mag"] = None
    assert parse_feature(feature) is None


# ── Open-Meteo ──


def test_wmo_condition_mapping():
    assert wmo_to_condition(0) is WeatherCondition.CLEAR
    assert wmo_to_condition(65) is WeatherCondition.HEAVY_RAIN
    assert wmo_to_condition(95) is WeatherCondition.THUNDERSTORM
    assert wmo_to_condition(9999) is WeatherCondition.UNKNOWN


def test_rainfall_from_hourly_windows():
    """26 jam data, 1mm/jam → window 1j=1, 6j=6, 24j=24."""
    now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    times = [(now - timedelta(hours=25 - i)).strftime("%Y-%m-%dT%H:%M") for i in range(26)]
    values = [1.0] * 26
    result = rainfall_from_hourly(
        {"time": times, "precipitation": values}, now + timedelta(minutes=30)
    )
    assert result is not None
    r1, r6, r24 = result
    assert r1 == 1.0
    assert r6 == 6.0
    assert r24 == 24.0


def test_rainfall_from_hourly_empty_returns_none():
    assert rainfall_from_hourly({}, datetime.now(UTC)) is None
