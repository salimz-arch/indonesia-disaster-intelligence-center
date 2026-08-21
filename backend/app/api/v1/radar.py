"""Radar endpoints — metadata frame radar hujan RainViewer.

Frontend memakai frames ini untuk animasi pergerakan hujan (§11).
Tile PNG dimuat langsung oleh MapLibre dari host RainViewer.
"""
import logging
from time import perf_counter

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.api.envelope import fail, ok
from app.core.cache import cache_get_json, cache_set_json
from app.core.exceptions import ProviderError
from app.db.session import AsyncSessionLocal
from app.providers.rainviewer import RainViewerProvider
from app.services.source_service import mark_failure, mark_success

logger = logging.getLogger("app.api.radar")

router = APIRouter(prefix="/radar", tags=["radar"])

RADAR_CACHE_KEY = "radar:frames"
RADAR_CACHE_TTL = 120  # detik
SRC_RADAR = "rainviewer-radar"


async def _mark(ok_status: bool, latency_ms: int = 0, error: str = "") -> None:
    """Catat status ke data_sources — best effort, tidak pernah raise."""
    try:
        async with AsyncSessionLocal() as session:
            if ok_status:
                await mark_success(session, SRC_RADAR, latency_ms)
            else:
                await mark_failure(session, SRC_RADAR, error)
    except Exception:
        logger.exception("gagal mencatat status radar")


@router.get("", response_model=None)
async def radar_frames() -> dict | JSONResponse:
    """Daftar frame radar (past + nowcast) + host tile."""
    cached = await cache_get_json(RADAR_CACHE_KEY)
    if cached is not None:
        return ok(cached, source="rainviewer")

    t0 = perf_counter()
    try:
        payload = await RainViewerProvider().fetch_frames()
    except ProviderError as exc:
        await _mark(ok_status=False, error=exc.message)
        return JSONResponse(
            status_code=503,
            content=fail(
                "DATA_SOURCE_UNAVAILABLE", f"Radar provider gagal: {exc.message}"
            ),
        )
    await cache_set_json(RADAR_CACHE_KEY, payload, RADAR_CACHE_TTL)
    await _mark(ok_status=True, latency_ms=int((perf_counter() - t0) * 1000))
    return ok(payload, source="rainviewer")
