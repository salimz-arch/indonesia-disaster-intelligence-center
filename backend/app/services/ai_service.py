"""AI service — orchestrator §1.9: context → risk engine → provider → validator."""
import logging
from datetime import UTC, datetime, timedelta

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import get_ai_provider
from app.ai.providers.mock import MockAIProvider
from app.ai.risk_engine import compute_risk
from app.core.cache import cache_get_json, cache_set_json
from app.models import (
    AIReport,
    Earthquake,
    Location,
    RainfallObservation,
    WeatherObservation,
)
from app.schemas.ai_report import (
    AIAnalyzeResponse,
    AISituationOutputSchema,
    risk_level,
)
from app.schemas.earthquake import EarthquakeRead
from app.schemas.rainfall import RainfallObservationRead
from app.schemas.weather import WeatherObservationRead

logger = logging.getLogger("app.services.ai")
CACHE_TTL = 300


async def _build_context(
    session: AsyncSession,
) -> tuple[dict, list, list, list]:
    """Kumpulkan data riil 24 jam — JSON-serializable untuk LLM & audit."""
    since = datetime.now(UTC) - timedelta(hours=24)

    quake_stmt = (
        sa.select(Earthquake)
        .where(Earthquake.event_time >= since)
        .order_by(Earthquake.event_time.desc())
    )
    quakes = [
        EarthquakeRead.model_validate(r)
        for r in (await session.scalars(quake_stmt)).all()
    ]

    loc_stmt = sa.select(Location).where(Location.is_primary)
    loc_names = {
        loc.id: loc.name for loc in (await session.scalars(loc_stmt)).all()
    }

    weather, rainfall = [], []
    for loc_id in loc_names:
        w_stmt = (
            sa.select(WeatherObservation)
            .where(WeatherObservation.location_id == loc_id)
            .order_by(WeatherObservation.observed_at.desc())
            .limit(1)
        )
        w = (await session.scalars(w_stmt)).first()
        if w:
            weather.append(WeatherObservationRead.model_validate(w))

        r_stmt = (
            sa.select(RainfallObservation)
            .where(RainfallObservation.location_id == loc_id)
            .order_by(RainfallObservation.observed_at.desc())
            .limit(1)
        )
        r = (await session.scalars(r_stmt)).first()
        if r:
            rainfall.append(RainfallObservationRead.model_validate(r))

    max_mag = max((e.magnitude for e in quakes), default=None)
    significant = [e for e in quakes if e.magnitude >= 4.5]

    context = {
        "generated_at": datetime.now(UTC).isoformat(),
        "window_hours": 24,
        "earthquakes": {
            "total_24h": len(quakes),
            "max_magnitude": max_mag,
            "recent_significant": [
                e.model_dump(mode="json") for e in significant[:5]
            ],
        },
        "weather": {
            "total_locations": len(weather),
            "extreme_locations": [
                loc_names.get(w.location_id, str(w.location_id))
                for w in weather
                if w.condition_code in ("thunderstorm", "extreme")
            ],
        },
        "rainfall": {
            "total_locations": len(rainfall),
            "raining_locations": sum(
                1 for r in rainfall if r.rainfall_1h_mm > 0
            ),
            "peak_1h_mm": max(
                (r.rainfall_1h_mm for r in rainfall), default=None
            ),
            "top_rain_locations": [
                loc_names.get(r.location_id, str(r.location_id))
                for r in sorted(
                    rainfall, key=lambda x: x.rainfall_1h_mm, reverse=True
                )[:3]
                if r.rainfall_1h_mm > 0
            ],
        },
    }
    return context, quakes, weather, rainfall


async def run_analysis(
    session: AsyncSession,
    force: bool = False,
) -> AIAnalyzeResponse:
    """Analisis lengkap — cache 5 menit (force=true bypass)."""
    cache_key = "ai:analysis"
    if not force:
        cached = await cache_get_json(cache_key)
        if cached is not None:
            return AIAnalyzeResponse.model_validate(cached)

    context, quakes, weather, rainfall = await _build_context(session)

    assessment = compute_risk(quakes, weather, rainfall)
    risk_dict = {
        "score": assessment.score,
        "level": assessment.level,
        "factors": assessment.factors,
        "note": "Internal Monitoring Score — bukan prediksi bencana",
    }

    provider = get_ai_provider()
    fallback_used = False
    provider_error: str | None = None

    try:
        raw = await provider.analyze(context, risk_dict)
        output = AISituationOutputSchema.model_validate(dict(raw))
    except Exception as exc:
        if provider.name == "mock":
            raise
        provider_error = f"{exc.__class__.__name__}: {exc}"
        logger.warning(
            "AI provider '%s' gagal (%s) — fallback ke mock",
            provider.name,
            provider_error[:300],
        )
        provider = MockAIProvider()
        raw = await provider.analyze(context, risk_dict)
        output = AISituationOutputSchema.model_validate(dict(raw))
        fallback_used = True

    report = AIAnalyzeResponse(
        risk_score=assessment.score,
        risk_level=risk_level(assessment.score),
        factors=assessment.factors,
        generated_at=datetime.now(UTC),
        provider=provider.name,
        model=getattr(provider, "model", ""),
        current_situation=output.current_situation,
        main_factors=output.main_factors,
        areas_of_concern=output.areas_of_concern,
        recommended_monitoring=output.recommended_monitoring,
        limitations=output.limitations,
        data_coverage={
            "earthquakes_24h": context["earthquakes"]["total_24h"],
            "weather_locations": context["weather"]["total_locations"],
            "rainfall_locations": context["rainfall"]["total_locations"],
            "window_hours": 24,
        },
        fallback_used=fallback_used,
        provider_error=provider_error,
    )

    try:
        session.add(
            AIReport(
                provider=report.provider,
                model=report.model,
                risk_score=report.risk_score,
                context_json=context,
                output_json=report.model_dump(mode="json"),
            )
        )
        await session.commit()
    except Exception:
        await session.rollback()
        logger.exception("gagal persist ai_report")

    await cache_set_json(cache_key, report.model_dump(mode="json"), CACHE_TTL)
    return report
