"""Integration test: constraint DB + validasi canonical schema."""

from datetime import UTC, datetime, timedelta

import pytest
import sqlalchemy as sa
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.models import Earthquake, Location, WeatherObservation
from app.schemas.earthquake import (
    EarthquakeCreate,
    EarthquakeRead,
    magnitude_category,
    magnitude_severity,
)
from app.schemas.enums import Severity


def _create_kwargs(**overrides) -> dict:
    base = dict(
        provider="bmkg",
        source_id="eq-test-001",
        magnitude=5.2,
        depth_km=18.0,
        latitude=3.5,
        longitude=98.6,
        event_time=datetime.now(UTC) - timedelta(minutes=10),
    )
    base.update(overrides)
    return base


def _quake_orm(**overrides) -> Earthquake:
    return Earthquake(**_create_kwargs(**overrides))


# ── Unit: kategori magnitude (boundary persis) ──


@pytest.mark.parametrize(
    ("magnitude", "expected"),
    [
        (2.9, "low"),
        (3.0, "moderate"),
        (3.9, "moderate"),
        (4.0, "significant"),
        (5.0, "strong"),
        (6.0, "major"),
        (7.4, "severe"),
    ],
)
def test_magnitude_category_boundaries(magnitude: float, expected: str):
    assert magnitude_category(magnitude).value == expected


def test_magnitude_severity_mapping():
    assert magnitude_severity(2.0) is Severity.LOW
    assert magnitude_severity(4.5) is Severity.HIGH
    assert magnitude_severity(8.0) is Severity.CRITICAL


# ── Unit: validasi canonical schema ──


def test_earthquake_create_rejects_out_of_range_latitude():
    with pytest.raises(ValidationError):
        EarthquakeCreate(**_create_kwargs(latitude=50.0))


def test_earthquake_create_rejects_future_time():
    with pytest.raises(ValidationError):
        EarthquakeCreate(**_create_kwargs(event_time=datetime.now(UTC) + timedelta(hours=1)))


def test_earthquake_create_normalizes_naive_time_to_utc():
    naive = datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=5)
    obj = EarthquakeCreate(**_create_kwargs(event_time=naive))
    assert obj.event_time.tzinfo is not None


# ── Integration: constraint database ──


async def test_earthquake_dedup_constraint(db_session):
    """Gempa sama dari provider sama TIDAK boleh masuk dua kali."""
    db_session.add(_quake_orm())
    await db_session.commit()

    db_session.add(_quake_orm())  # (provider, source_id) identik
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


async def test_earthquake_magnitude_db_check_constraint(db_session):
    """Defense in depth: Pydantic gagal → DB CheckConstraint juga menolak."""
    db_session.add(_quake_orm(magnitude=12.0))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


async def test_earthquake_read_computed_category(db_session):
    """ORM row → DTO dengan kategori & severity terhitung backend."""
    quake = _quake_orm(magnitude=5.2)
    db_session.add(quake)
    await db_session.commit()
    await db_session.refresh(quake)

    dto = EarthquakeRead.model_validate(quake)
    assert dto.category.value == "strong"
    assert dto.severity is Severity.HIGH


async def test_weather_fk_cascade_delete(db_session):
    """Hapus lokasi → observasi cuacanya ikut terhapus (ON DELETE CASCADE)."""
    loc = Location(name="Test City", region="Test", latitude=-6.2, longitude=106.8)
    db_session.add(loc)
    await db_session.flush()

    db_session.add(
        WeatherObservation(
            location_id=loc.id,
            temperature_c=28.0,
            humidity_pct=87,
            pressure_hpa=1008,
            wind_speed_kmh=21,
            condition_code="heavy_rain",
            condition_text="Heavy Rain",
            observed_at=datetime.now(UTC),
            source="open-meteo",
        )
    )
    await db_session.commit()

    await db_session.delete(loc)
    await db_session.commit()

    count = await db_session.scalar(sa.select(sa.func.count()).select_from(WeatherObservation))
    assert count == 0
