"""Integration test: alert generation — thresholds, dedup, expiry filter."""

from datetime import UTC, datetime, timedelta

from app.schemas.earthquake import EarthquakeRead
from app.services.alert_service import (
    generate_earthquake_alerts,
    generate_rainfall_alerts,
    get_active_alerts,
)


def _eq(magnitude: float, tsunami: bool = False, sid: str = "x") -> EarthquakeRead:
    return EarthquakeRead(
        id=1,
        provider="t",
        source_id=sid,
        magnitude=magnitude,
        depth_km=25.0,
        latitude=-6.2,
        longitude=106.8,
        location_text="Test Loc",
        region=None,
        event_time=datetime.now(UTC) - timedelta(minutes=10),
        potential_tsunami=tsunami,
    )


async def test_earthquake_alert_thresholds(db_session):
    alerts = await generate_earthquake_alerts(
        db_session, [_eq(4.9, sid="a"), _eq(5.2, sid="b"), _eq(6.1, sid="c"), _eq(7.2, sid="d")]
    )
    assert len(alerts) == 3
    by_sid = {a["source_id"]: a for a in alerts}
    assert by_sid["eq:t:b"]["severity"] == "watch"
    assert by_sid["eq:t:c"]["severity"] == "warning"
    assert by_sid["eq:t:d"]["severity"] == "critical"


async def test_tsunami_forces_critical(db_session):
    alerts = await generate_earthquake_alerts(db_session, [_eq(5.0, tsunami=True, sid="ts")])
    assert len(alerts) == 1
    assert alerts[0]["severity"] == "critical"
    assert "TSUNAMI" in alerts[0]["title"]


async def test_alert_dedup(db_session):
    e = _eq(5.5, sid="dup")
    first = await generate_earthquake_alerts(db_session, [e])
    second = await generate_earthquake_alerts(db_session, [e])
    assert len(first) == 1 and len(second) == 0


async def test_rainfall_alert_thresholds(db_session):
    from app.schemas.rainfall import RainfallObservationCreate

    now = datetime.now(UTC)
    obs_heavy = RainfallObservationCreate(
        location_id=1, rainfall_1h_mm=15.0, observed_at=now, source="t"
    )
    obs_extreme = RainfallObservationCreate(
        location_id=2, rainfall_1h_mm=25.0, observed_at=now, source="t"
    )
    obs_light = RainfallObservationCreate(
        location_id=3, rainfall_1h_mm=3.0, observed_at=now, source="t"
    )
    alerts = await generate_rainfall_alerts(
        db_session, {1: "A", 2: "B", 3: "C"}, [obs_heavy, obs_extreme, obs_light]
    )
    assert len(alerts) == 2
    severities = {a["location_text"]: a["severity"] for a in alerts}
    assert severities["A"] == "watch" and severities["B"] == "warning"


async def test_active_excludes_expired(db_session):
    import sqlalchemy as sa

    from app.models import Alert

    await generate_earthquake_alerts(db_session, [_eq(5.2, sid="act")])
    active = await get_active_alerts(db_session)
    assert any(a.source_id == "eq:t:act" for a in active)
    await db_session.execute(
        sa.update(Alert)
        .where(Alert.source_id == "eq:t:act")
        .values(expires_at=datetime.now(UTC) - timedelta(hours=1))
    )
    await db_session.commit()
    active = await get_active_alerts(db_session)
    assert not any(a.source_id == "eq:t:act" for a in active)
