"""Integration test: earthquake stats aggregation."""

from datetime import UTC, datetime, timedelta

from app.schemas.earthquake import EarthquakeCreate
from app.services.earthquake_service import get_stats, ingest_earthquakes


def _event(source_id: str, magnitude: float, minutes_ago: int) -> EarthquakeCreate:
    return EarthquakeCreate(
        provider="test",
        source_id=source_id,
        magnitude=magnitude,
        depth_km=10.0 * (minutes_ago // 10 + 1),
        latitude=-6.2,
        longitude=106.8,
        event_time=datetime.now(UTC) - timedelta(minutes=minutes_ago),
    )


async def test_stats_aggregation(db_session):
    await ingest_earthquakes(
        db_session,
        [
            _event("s1", 2.0, 30),
            _event("s2", 4.5, 60),
            _event("s3", 5.5, 90),
        ],
    )
    stats = await get_stats(db_session, hours=24)

    assert stats["total"] == 3
    assert stats["max_magnitude"]["magnitude"] == 5.5
    assert stats["distribution"]["low"] == 1
    assert stats["distribution"]["significant"] == 1
    assert stats["distribution"]["strong"] == 1
    assert stats["avg_depth_km"] == 70.0  # (10+20+30)/3
    assert stats["recent"]["source_id"] == "s1"


async def test_stats_empty(db_session):
    stats = await get_stats(db_session, hours=24)
    assert stats["total"] == 0
    assert stats["max_magnitude"] is None
    assert stats["avg_depth_km"] is None
    assert all(v == 0 for v in stats["distribution"].values())
