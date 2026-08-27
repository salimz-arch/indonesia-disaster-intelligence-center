"""Unit test Risk Engine — deterministik & reproducible (§19)."""
from datetime import UTC, datetime, timedelta

from app.ai.risk_engine import compute_risk
from app.schemas.earthquake import EarthquakeRead
from app.schemas.rainfall import RainfallObservationRead
from app.schemas.weather import WeatherObservationRead


def _eq(magnitude: float, minutes_ago: int = 30) -> EarthquakeRead:
    return EarthquakeRead(
        id=1,
        provider="t",
        source_id=f"t{magnitude}",
        magnitude=magnitude,
        depth_km=10.0,
        latitude=-6.2,
        longitude=106.8,
        location_text="Test",
        region=None,
        event_time=datetime.now(UTC) - timedelta(minutes=minutes_ago),
        potential_tsunami=False,
    )


def _rain(mm: float) -> RainfallObservationRead:
    return RainfallObservationRead(
        id=1,
        location_id=1,
        rainfall_1h_mm=mm,
        rainfall_6h_mm=mm * 2,
        rainfall_24h_mm=mm * 4,
        observed_at=datetime.now(UTC),
        source="t",
    )


def _wx(condition: str) -> WeatherObservationRead:
    return WeatherObservationRead(
        id=1,
        location_id=1,
        temperature_c=28.0,
        feels_like_c=None,
        humidity_pct=80,
        pressure_hpa=1010,
        wind_speed_kmh=10,
        wind_direction_deg=None,
        visibility_km=None,
        cloud_cover_pct=None,
        precipitation_mm=0,
        condition_code=condition,  # type: ignore[arg-type]
        condition_text=condition,
        uv_index=None,
        observed_at=datetime.now(UTC),
        source="t",
    )


def test_calm_conditions_low():
    result = compute_risk([], [_wx("clear")], [_rain(0.0)])
    assert result.score == 10  # baseline saja
    assert result.level == "low"


def test_major_earthquake_high():
    result = compute_risk([_eq(6.2)], [], [])
    assert result.score == 51  # baseline + M6.2 + 1 significant
    assert result.level == "moderate"
    assert result.factors[0]["code"] == "seismic_max"


def test_extreme_rain_and_storm():
    result = compute_risk(
        [], [_wx("thunderstorm")], [_rain(25.0)]
    )
    assert result.score >= 45
    assert result.level == "moderate"


def test_reproducible():
    a = compute_risk([_eq(5.0), _eq(4.6)], [_wx("rain")], [_rain(6.0)])
    b = compute_risk([_eq(5.0), _eq(4.6)], [_wx("rain")], [_rain(6.0)])
    assert a.score == b.score and a.level == b.level


def test_score_capped_100():
    result = compute_risk(
        [_eq(7.5), _eq(5.0), _eq(5.0)],
        [_wx("thunderstorm"), _wx("extreme"), _wx("thunderstorm")],
        [_rain(30.0)],
    )
    assert result.score <= 100
