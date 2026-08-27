"""Integration test: ingest dedup (exact + cross-provider similar)."""
from datetime import UTC, datetime, timedelta

from app.schemas.earthquake import EarthquakeCreate
from app.services.earthquake_service import ingest_earthquakes


def _event(
    provider="bmkg",
    source_id="e1",
    magnitude=5.0,
    minutes_ago=30,
    lat=3.5,
    lon=98.6,
) -> EarthquakeCreate:
    return EarthquakeCreate(
        provider=provider,
        source_id=source_id,
        magnitude=magnitude,
        depth_km=20.0,
        latitude=lat,
        longitude=lon,
        event_time=datetime.now(UTC) - timedelta(minutes=minutes_ago),
    )


async def test_ingest_inserts_new_events(db_session):
    result = await ingest_earthquakes(
        db_session, [_event(), _event(source_id="e2", minutes_ago=60)]
    )
    assert result.inserted == 2
    assert len(result.inserted_events) == 2
    assert result.inserted_events[0].id is not None
    assert result.inserted_events[0].magnitude == 5.0


async def test_ingest_exact_duplicate_skipped(db_session):
    await ingest_earthquakes(db_session, [_event()])
    result = await ingest_earthquakes(db_session, [_event()])
    assert result.inserted == 0
    assert result.duplicate == 1


async def test_ingest_cross_provider_similar_skipped(db_session):
    """Gempa sama dilaporkan BMKG & USGS (Δt<150s, ΔM≤0.8, Δjarak≤100km)."""
    await ingest_earthquakes(db_session, [_event(provider="bmkg", source_id="bm1")])
    result = await ingest_earthquakes(
        db_session,
        [
            _event(
                provider="usgs",
                source_id="us1",
                minutes_ago=30,
                magnitude=5.2,
                lat=3.51,
                lon=98.61,
            )
        ],
    )
    assert result.inserted == 0
    assert result.similar == 1


async def test_ingest_different_events_both_stored(db_session):
    await ingest_earthquakes(db_session, [_event(minutes_ago=30)])
    result = await ingest_earthquakes(
        db_session,
        [
            _event(
                source_id="e2",
                minutes_ago=300,
                magnitude=4.0,
                lat=-6.2,
                lon=107.0,
            )
        ],
    )
    assert result.inserted == 1
