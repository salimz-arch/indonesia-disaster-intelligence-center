"""Alert service — generate & query alerts (§13).

Aturan DETERMINISTIK dari data (bukan AI, bukan klaim resmi):
- Gempa: tsunami/M>=7 -> CRITICAL · M>=6 -> WARNING · M>=5 -> WATCH
- Hujan: >20 mm/jam (ekstrem) -> WARNING · 10-20 (sangat lebat) -> WATCH
Dedup via source_id unik; expired otomatis via expires_at.
"""

import logging
from datetime import UTC, datetime, timedelta

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Alert
from app.schemas.alert import AlertRead
from app.schemas.enums import AlertLevel, EventType

logger = logging.getLogger("app.services.alert")

ALERT_TTL_HOURS: dict[str, int] = {
    "critical": 24,
    "warning": 24,
    "watch": 12,
}


def _serialize(alert: Alert) -> dict:
    return AlertRead.model_validate(alert).model_dump(mode="json")


def _severity_for_earthquake(e) -> AlertLevel | None:
    if e.potential_tsunami or e.magnitude >= 7.0:
        return AlertLevel.CRITICAL
    if e.magnitude >= 6.0:
        return AlertLevel.WARNING
    if e.magnitude >= 5.0:
        return AlertLevel.WATCH
    return None


async def _alert_exists(session: AsyncSession, source_id: str) -> bool:
    stmt = sa.select(Alert.id).where(Alert.source_id == source_id).limit(1)
    return await session.scalar(stmt) is not None


async def generate_earthquake_alerts(session: AsyncSession, events: list) -> list[dict]:
    """Buat alert untuk gempa >= threshold. Return dict (payload SSE)."""
    created: list[Alert] = []
    now = datetime.now(UTC)
    for e in events:
        severity = _severity_for_earthquake(e)
        if severity is None:
            continue
        source_id = f"eq:{e.provider}:{e.source_id}"
        if await _alert_exists(session, source_id):
            continue

        loc = e.location_text or f"{e.latitude:.2f}, {e.longitude:.2f}"
        tsunami_note = " — Berpotensi TSUNAMI" if e.potential_tsunami else ""
        message = (
            f"M{e.magnitude:.1f} pada kedalaman {e.depth_km:.0f} km — {loc}. "
            f"Sumber: {e.provider}. "
            "Verifikasi informasi resmi ke BMKG."
        )
        created.append(
            Alert(
                event_type=EventType.EARTHQUAKE,
                severity=severity,
                title=f"Gempa M{e.magnitude:.1f}{tsunami_note}",
                message=message,
                latitude=e.latitude,
                longitude=e.longitude,
                location_text=e.location_text,
                triggered_at=now,
                expires_at=now + timedelta(hours=ALERT_TTL_HOURS[severity]),
                source=e.provider,
                source_id=source_id,
            )
        )
    if created:
        session.add_all(created)
        await session.commit()
        logger.info("alert: %d alert gempa dibuat", len(created))
    return [_serialize(a) for a in created]


async def generate_rainfall_alerts(
    session: AsyncSession,
    loc_map: dict[int, str],
    observations: list,
) -> list[dict]:
    """WATCH/WARNING untuk intensitas hujan tinggi. Dedup per lokasi per hari."""
    created: list[Alert] = []
    now = datetime.now(UTC)
    today = now.strftime("%Y-%m-%d")

    for obs in observations:
        mm = obs.rainfall_1h_mm
        if mm > 20:
            severity = AlertLevel.WARNING
            intensity = "ekstrem"
        elif mm >= 10:
            severity = AlertLevel.WATCH
            intensity = "sangat lebat"
        else:
            continue

        source_id = f"rain:{obs.location_id}:{today}"
        if await _alert_exists(session, source_id):
            continue

        name = loc_map.get(obs.location_id, f"Lokasi {obs.location_id}")
        message = (
            f"Intensitas hujan {mm:.1f} mm/jam di {name}. "
            "Waspadai potensi banjir/longsor di wilayah sekitar. "
            "Data: Open-Meteo — verifikasi ke BMKG."
        )
        created.append(
            Alert(
                event_type=EventType.HEAVY_RAIN,
                severity=severity,
                title=f"Curah hujan {intensity} — {name}",
                message=message,
                latitude=None,
                longitude=None,
                location_text=name,
                triggered_at=now,
                expires_at=now + timedelta(hours=6),
                source="open-meteo",
                source_id=source_id,
            )
        )
    if created:
        session.add_all(created)
        await session.commit()
        logger.info("alert: %d alert hujan dibuat", len(created))
    return [_serialize(a) for a in created]


async def get_active_alerts(session: AsyncSession) -> list[AlertRead]:
    """Alert yang belum expired, terbaru duluan."""
    now = datetime.now(UTC)
    stmt = (
        sa.select(Alert)
        .where(sa.or_(Alert.expires_at.is_(None), Alert.expires_at > now))
        .order_by(Alert.triggered_at.desc())
        .limit(50)
    )
    rows = (await session.scalars(stmt)).all()
    return [AlertRead.model_validate(r) for r in rows]


async def get_alert_history(session: AsyncSession, limit: int = 50) -> list[AlertRead]:
    stmt = sa.select(Alert).order_by(Alert.triggered_at.desc()).limit(limit)
    rows = (await session.scalars(stmt)).all()
    return [AlertRead.model_validate(r) for r in rows]
