"""Utilitas schema bersama — tipe reusable untuk semua modul."""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from pydantic import AfterValidator, Field

# Toleransi clock skew provider (detik)
MAX_FUTURE_SKEW_SECONDS = 300


def _to_utc(v: datetime) -> datetime:
    if v.tzinfo is None:
        v = v.replace(tzinfo=UTC)
    return v.astimezone(UTC)


def _utc_not_future(v: datetime) -> datetime:
    """Waktu KEJADIAN: tolak >5 menit di masa depan (gempa, observasi)."""
    v = _to_utc(v)
    if v > datetime.now(UTC) + timedelta(seconds=MAX_FUTURE_SKEW_SECONDS):
        raise ValueError("timestamp berada lebih dari 5 menit di masa depan")
    return v


def _utc_allow_future(v: datetime) -> datetime:
    """Waktu JADWAL/EXPIRY: boleh masa depan (alert berlaku hingga N jam)."""
    return _to_utc(v)


UTCDateTime = Annotated[datetime, AfterValidator(_utc_not_future)]
UTCTimestamp = Annotated[datetime, AfterValidator(_utc_allow_future)]

# Rentang valid wilayah Indonesia (bbox + padding)
IndonesiaLatitude = Annotated[float, Field(ge=-12.0, le=7.0)]
IndonesiaLongitude = Annotated[float, Field(ge=94.0, le=142.0)]
