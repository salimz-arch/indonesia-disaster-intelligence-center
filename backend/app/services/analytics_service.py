"""Analytics service — agregasi historis untuk /analytics (§20)."""
import logging
from datetime import UTC, datetime, timedelta

import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Earthquake, Location, RainfallObservation, WeatherObservation

logger = logging.getLogger("app.services.analytics")

MAGNITUDE_BANDS: list[tuple[str, float | None, float | None]] = [
    ("low", None, 3.0),
    ("moderate", 3.0, 4.0),
    ("significant", 4.0, 5.0),
    ("strong", 5.0, 6.0),
    ("major", 6.0, 7.0),
    ("severe", 7.0, None),
]

DEPTH_BANDS: list[tuple[str, float | None, float | None]] = [
    ("shallow", None, 70.0),
    ("intermediate", 70.0, 300.0),
    ("deep", 300.0, None),
]


def _wib_day(column):
    """Ekspresi SQL: tanggal (YYYY-MM-DD) dalam WIB dari kolom timestamp UTC."""
    return sa.func.to_char(column + text("interval '7 hours'"), "YYYY-MM-DD")


def _wib_hour(column):
    """Ekspresi SQL: jam (0-23) dalam WIB."""
    return sa.extract("hour", column + text("interval '7 hours'"))


async def _band_count(
    session: AsyncSession, base, column, bands
) -> dict[str, int]:
    out: dict[str, int] = {}
    for name, lo, hi in bands:
        conds = [base]
        if lo is not None:
            conds.append(column >= lo)
        if hi is not None:
            conds.append(column < hi)
        cnt = await session.scalar(
            sa.select(sa.func.count())
            .select_from(Earthquake)
            .where(sa.and_(*conds))
        )
        out[name] = cnt or 0
    return out


async def earthquake_analytics(session: AsyncSession, days: int) -> dict:
    since = datetime.now(UTC) - timedelta(days=days)
    base = Earthquake.event_time >= since
    day_expr = _wib_day(Earthquake.event_time)

    timeline_rows = (
        await session.execute(
            sa.select(
                day_expr.label("day"),
                sa.func.count().label("cnt"),
                sa.func.max(Earthquake.magnitude).label("max_mag"),
            )
            .where(base)
            .group_by(day_expr)
            .order_by(day_expr)
        )
    ).all()

    timeline = [
        {
            "date": r.day,
            "count": r.cnt,
            "max_magnitude": float(r.max_mag) if r.max_mag is not None else None,
        }
        for r in timeline_rows
    ]

    distribution = await _band_count(
        session, base, Earthquake.magnitude, MAGNITUDE_BANDS
    )
    depth_distribution = await _band_count(
        session, base, Earthquake.depth_km, DEPTH_BANDS
    )

    hour_rows = (
        await session.execute(
            sa.select(
                _wib_hour(Earthquake.event_time).label("h"),
                sa.func.count().label("cnt"),
            )
            .where(base)
            .group_by(_wib_hour(Earthquake.event_time))
        )
    ).all()
    hour_map = {int(r.h): r.cnt for r in hour_rows}
    by_hour = [hour_map.get(h, 0) for h in range(24)]

    total = sum(t["count"] for t in timeline)
    strongest = (
        await session.scalars(
            sa.select(Earthquake)
            .where(base)
            .order_by(Earthquake.magnitude.desc(), Earthquake.event_time.desc())
            .limit(1)
        )
    ).first()
    most_active = max(timeline, key=lambda t: t["count"], default=None)

    return {
        "days": days,
        "timeline": timeline,
        "distribution": distribution,
        "depth_distribution": depth_distribution,
        "by_hour": by_hour,
        "summary": {
            "total": total,
            "avg_per_day": round(total / days, 1) if days else 0.0,
            "max_magnitude": strongest.magnitude if strongest else None,
            "max_magnitude_location": strongest.location_text if strongest else None,
            "most_active_day": most_active["date"] if most_active else None,
            "most_active_day_count": most_active["count"] if most_active else 0,
        },
    }


async def rainfall_analytics(session: AsyncSession, days: int) -> dict:
    since = datetime.now(UTC) - timedelta(days=days)
    base = RainfallObservation.observed_at >= since
    day_expr = _wib_day(RainfallObservation.observed_at)

    timeline_rows = (
        await session.execute(
            sa.select(
                day_expr.label("day"),
                sa.func.max(RainfallObservation.rainfall_1h_mm).label("peak_1h"),
                sa.func.max(RainfallObservation.rainfall_24h_mm).label("peak_24h"),
                sa.func.count(
                    sa.func.distinct(
                        sa.case(
                            (
                                RainfallObservation.rainfall_1h_mm > 0,
                                RainfallObservation.location_id,
                            )
                        )
                    )
                ).label("raining"),
            )
            .where(base)
            .group_by(day_expr)
            .order_by(day_expr)
        )
    ).all()

    timeline = [
        {
            "date": r.day,
            "peak_1h_mm": float(r.peak_1h) if r.peak_1h is not None else None,
            "peak_24h_mm": float(r.peak_24h) if r.peak_24h is not None else None,
            "locations_raining": r.raining or 0,
        }
        for r in timeline_rows
    ]

    top_rows = (
        await session.execute(
            sa.select(
                Location.name.label("name"),
                sa.func.max(RainfallObservation.rainfall_1h_mm).label("max_1h"),
                sa.func.max(RainfallObservation.rainfall_24h_mm).label("max_24h"),
            )
            .join(
                RainfallObservation,
                RainfallObservation.location_id == Location.id,
            )
            .where(base)
            .group_by(Location.name)
            .order_by(sa.desc(sa.func.max(RainfallObservation.rainfall_1h_mm)))
            .limit(8)
        )
    ).all()

    top_locations = [
        {
            "name": r.name,
            "max_1h_mm": float(r.max_1h) if r.max_1h is not None else None,
            "max_24h_mm": float(r.max_24h) if r.max_24h is not None else None,
        }
        for r in top_rows
    ]

    return {"days": days, "timeline": timeline, "top_locations": top_locations}


async def weather_analytics(session: AsyncSession, days: int) -> dict:
    since = datetime.now(UTC) - timedelta(days=days)
    base = WeatherObservation.observed_at >= since
    day_expr = _wib_day(WeatherObservation.observed_at)

    timeline_rows = (
        await session.execute(
            sa.select(
                day_expr.label("day"),
                sa.func.avg(WeatherObservation.temperature_c).label("avg_t"),
                sa.func.min(WeatherObservation.temperature_c).label("min_t"),
                sa.func.max(WeatherObservation.temperature_c).label("max_t"),
            )
            .where(base)
            .group_by(day_expr)
            .order_by(day_expr)
        )
    ).all()

    timeline = [
        {
            "date": r.day,
            "avg_temp": round(float(r.avg_t), 1) if r.avg_t is not None else None,
            "min_temp": round(float(r.min_t), 1) if r.min_t is not None else None,
            "max_temp": round(float(r.max_t), 1) if r.max_t is not None else None,
        }
        for r in timeline_rows
    ]

    cond_rows = (
        await session.execute(
            sa.select(
                WeatherObservation.condition_code.label("code"),
                sa.func.count().label("cnt"),
            )
            .where(base)
            .group_by(WeatherObservation.condition_code)
        )
    ).all()
    condition_counts = {r.code: r.cnt for r in cond_rows}

    return {"days": days, "timeline": timeline, "condition_counts": condition_counts}
