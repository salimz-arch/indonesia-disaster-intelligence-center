"""Integration test: rainfall history — ordering, filtering, window."""

from datetime import UTC, datetime, timedelta

from app.models import Location, RainfallObservation
from app.services.rainfall_service import get_history


async def _seed(session) -> int:
    loc = Location(name="Rain City", region="Test", latitude=-6.2, longitude=106.8)
    session.add(loc)
    await session.flush()
    now = datetime.now(UTC)
    for i in range(5):  # 5 observasi, 10 menit berjeda, rainfall_1h = 0..4
        session.add(
            RainfallObservation(
                location_id=loc.id,
                rainfall_1h_mm=float(i),
                rainfall_6h_mm=float(i * 2),
                rainfall_24h_mm=float(i * 4),
                observed_at=now - timedelta(minutes=(5 - i) * 10),
                source="test",
            )
        )
    await session.commit()
    return loc.id


async def test_history_returns_ascending(db_session):
    loc_id = await _seed(db_session)
    items = await get_history(db_session, loc_id, hours=24)

    assert len(items) == 5
    assert [i.rainfall_1h_mm for i in items] == [0.0, 1.0, 2.0, 3.0, 4.0]
    times = [i.observed_at for i in items]
    assert times == sorted(times)


async def test_history_filters_other_locations(db_session):
    loc_id = await _seed(db_session)
    other = Location(name="Other City", region="T", latitude=-6.3, longitude=106.9)
    db_session.add(other)
    await db_session.flush()
    db_session.add(
        RainfallObservation(
            location_id=other.id,
            rainfall_1h_mm=99.0,
            observed_at=datetime.now(UTC),
            source="test",
        )
    )
    await db_session.commit()

    items = await get_history(db_session, loc_id, hours=1)
    assert all(i.location_id == loc_id for i in items)
    assert len(items) == 5  # semua dalam window 1 jam


async def test_history_empty_location(db_session):
    items = await get_history(db_session, 99999, hours=24)
    assert items == []
