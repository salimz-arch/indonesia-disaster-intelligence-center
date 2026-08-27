"""Risk Engine deterministik — INTERNAL MONITORING SCORE (§19)."""
from dataclasses import dataclass

from app.schemas.earthquake import EarthquakeRead
from app.schemas.rainfall import RainfallObservationRead
from app.schemas.weather import WeatherObservationRead

EQ_MAGNITUDE_BREAKPOINTS: list[tuple[float, int]] = [
    (7.0, 45), (6.0, 38), (5.5, 30), (5.0, 24), (4.5, 18), (4.0, 12), (3.0, 6),
]
EQ_SIGNIFICANT_THRESHOLD = 4.5
EQ_SIGNIFICANT_POINTS = 3
RAINFALL_BREAKPOINTS: list[tuple[float, int]] = [(20.0, 30), (10.0, 24), (5.0, 16), (1.0, 8)]
EXTREME_WEATHER_CONDITIONS = {"thunderstorm", "extreme"}
EXTREME_WEATHER_POINTS = 5
BASELINE = 10

@dataclass(slots=True)
class RiskAssessment:
    score: int
    level: str
    factors: list[dict]

def _points_from_breakpoints(value: float, breakpoints: list[tuple[float, int]]) -> int:
    for threshold, points in breakpoints:
        if value >= threshold:
            return points
    return 0

def compute_risk(
    earthquakes_24h: list[EarthquakeRead],
    weather_latest: list[WeatherObservationRead],
    rainfall_latest: list[RainfallObservationRead],
) -> RiskAssessment:
    factors: list[dict] = []

    if earthquakes_24h:
        max_mag = max(e.magnitude for e in earthquakes_24h)
        eq_points = _points_from_breakpoints(max_mag, EQ_MAGNITUDE_BREAKPOINTS)
        if eq_points:
            factors.append({
                "code": "seismic_max",
                "label": f"Gempa terbesar M{max_mag:.1f} dalam 24 jam",
                "points": eq_points,
            })
        significant = [e for e in earthquakes_24h if e.magnitude >= EQ_SIGNIFICANT_THRESHOLD]
        sig_points = min(len(significant) * EQ_SIGNIFICANT_POINTS, 6)
        if sig_points:
            factors.append({
                "code": "seismic_count",
                "label": f"{len(significant)} gempa signifikan (M≥4.5) dalam 24 jam",
                "points": sig_points,
            })

    if rainfall_latest:
        peak = max(rainfall_latest, key=lambda r: r.rainfall_1h_mm)
        rain_points = _points_from_breakpoints(peak.rainfall_1h_mm, RAINFALL_BREAKPOINTS)
        if rain_points:
            factors.append({
                "code": "rainfall_intensity",
                "label": f"Intensitas hujan puncak {peak.rainfall_1h_mm:.1f} mm/jam",
                "points": rain_points,
            })

    extreme_locs = [w for w in weather_latest if w.condition_code in EXTREME_WEATHER_CONDITIONS]
    if extreme_locs:
        factors.append({
            "code": "extreme_weather",
            "label": f"Cuaca ekstrem aktif di {len(extreme_locs)} lokasi",
            "points": min(len(extreme_locs) * EXTREME_WEATHER_POINTS, 15),
        })

    score = min(100, BASELINE + sum(f["points"] for f in factors))

    if score <= 30:
        level = "low"
    elif score <= 60:
        level = "moderate"
    elif score <= 80:
        level = "high"
    else:
        level = "critical"

    factors.sort(key=lambda f: f["points"], reverse=True)
    return RiskAssessment(score=score, level=level, factors=factors)
