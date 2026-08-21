"""Utilitas schema bersama — tipe reusable untuk semua modul."""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from pydantic import AfterValidator, Field

# Toleransi clock skew provider (detik) — wajar untuk NTP drift
MAX_FUTURE_SKEW_SECONDS = 300


def normalize_utc_not_future(v: datetime) -> datetime:
    """Normalisasi ke UTC aware; tolak timestamp >5 menit di masa depan."""
    if v.tzinfo is None:
        v = v.replace(tzinfo=UTC)
    if v > datetime.now(UTC) + timedelta(seconds=MAX_FUTURE_SKEW_SECONDS):
        raise ValueError("timestamp berada lebih dari 5 menit di masa depan")
    return v.astimezone(UTC)


UTCDateTime = Annotated[datetime, AfterValidator(normalize_utc_not_future)]

# Rentang valid wilayah Indonesia (bbox + padding)
IndonesiaLatitude = Annotated[float, Field(ge=-12.0, le=7.0)]
IndonesiaLongitude = Annotated[float, Field(ge=94.0, le=142.0)]
