"""Integration test: analytics aggregation (WIB bucketing, band counts)."""

from datetime import UTC, datetime, timedelta

from app.models import Location, RainfallObservation
from app.schemas.earthquake import EarthquakeCreate
from app.services.analytics_service import earthquake_analytics, rainfall_analytics
from app.services.earthquake_service import ingest_earthquakes


def _eq(sid: str, mag: float, days_ago: int) -> EarthquakeCreate:
    return EarthquakeCreate(
        provider="t",
        source_id=sid,
        magnitude=mag,
        depth_km=20.0 * (days_ago + 1),
        latitude=-6.2,
        longitude=106.8,
        event_time=datetime.now(UTC) - timedelta(days=days_ago),
    )


async def test_earthquake_analytics_totals_and_bands(db_session):
    await ingest_earthquakes(
        db_session,
        [
            _eq("a1", 2.5, 0),
            _eq("a2", 4.5, 0),
            _eq("a3", 5.5, 1),
            _eq("a4", 6.1, 2),
        ],
    )
    result = await earthquake_analytics(db_session, days=7)

    assert result["summary"]["total"] == 4
    assert result["summary"]["max_magnitude"] == 6.1
    assert sum(t["count"] for t in result["timeline"]) == 4
    assert result["distribution"]["low"] == 1
    assert result["distribution"]["significant"] == 1
    assert result["distribution"]["strong"] == 1
    assert result["distribution"]["major"] == 1
    assert sum(result["depth_distribution"].values()) == 4
    assert sum(result["by_hour"]) == 4
    assert len(result["by_hour"]) == 24
    dates = [t["date"] for t in result["timeline"]]
    assert dates == sorted(dates)


async def test_rainfall_analytics_peaks(db_session):
    loc = Location(name="RainCity", region="T", latitude=-6.2, longitude=106.8)
    db_session.add(loc)
    await db_session.flush()
    now = datetime.now(UTC)
    for i in range(3):
        db_session.add(
            RainfallObservation(
                location_id=loc.id,
                rainfall_1h_mm=float(i),
                rainfall_6h_mm=None,
                rainfall_24h_mm=float(i * 10),
                observed_at=now - timedelta(hours=i),
                source="t",
            )
        )
    await db_session.commit()

    result = await rainfall_analytics(db_session, days=7)
    assert result["timeline"], "timeline tidak boleh kosong"
    assert max(t["peak_1h_mm"] for t in result["timeline"]) == 2.0
    assert result["top_locations"][0]["name"] == "RainCity"
