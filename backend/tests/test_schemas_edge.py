"""Edge validation tests — boundary bbox, rentang, tipe timestamp (§30)."""
from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.alert import AlertCreate, AlertRead
from app.schemas.earthquake import EarthquakeCreate
from app.schemas.enums import AlertLevel, EventType
from app.schemas.rainfall import RainfallObservationCreate


def _base_eq(**over):
    base = dict(
        provider="t",
        source_id="e1",
        magnitude=4.0,
        depth_km=10.0,
        latitude=-2.0,
        longitude=118.0,
        event_time=datetime.now(UTC) - timedelta(minutes=5),
    )
    base.update(over)
    return base


@pytest.mark.parametrize(
    "field,value",
    [
        ("latitude", 45.0),
        ("longitude", 200.0),
        ("magnitude", 12.0),
        ("depth_km", 800.0),
        ("event_time", datetime.now(UTC) + timedelta(hours=2)),
    ],
)
def test_earthquake_create_rejects_invalid(field, value):
    with pytest.raises(ValidationError):
        EarthquakeCreate(**_base_eq(**{field: value}))


def test_alert_expires_future_allowed_before_triggered_rejected():
    """expires_at BOLEH masa depan (UTCTimestamp) tapi harus > triggered."""
    now = datetime.now(UTC)

    ok = AlertCreate(
        event_type=EventType.EARTHQUAKE,
        severity=AlertLevel.WARNING,
        title="test title",
        message="m" * 20,
        triggered_at=now - timedelta(minutes=1),
        expires_at=now + timedelta(hours=6),
        source="t",
    )
    assert ok.expires_at > ok.triggered_at

    with pytest.raises(ValidationError):
        AlertCreate(
            event_type=EventType.EARTHQUAKE,
            severity=AlertLevel.WARNING,
            title="test title",
            message="m" * 20,
            triggered_at=now,
            expires_at=now - timedelta(hours=1),
            source="t",
        )


def test_alert_read_is_active_computed():
    now = datetime.now(UTC)
    common = dict(
        id=1,
        event_type=EventType.EARTHQUAKE,
        severity=AlertLevel.WARNING,
        title="test title",
        message="m" * 20,
        latitude=None,
        longitude=None,
        location_text=None,
        triggered_at=now,
        source="t",
        source_id=None,
    )
    active = AlertRead.model_validate(
        {**common, "expires_at": now + timedelta(hours=1)}
    )
    expired = AlertRead.model_validate(
        {**common, "expires_at": now - timedelta(hours=1)}
    )
    assert active.is_active is True
    assert expired.is_active is False


def test_rainfall_out_of_bounds_rejected():
    now = datetime.now(UTC)
    with pytest.raises(ValidationError):
        RainfallObservationCreate(
            location_id=1, rainfall_1h_mm=600.0, observed_at=now, source="t"
        )
