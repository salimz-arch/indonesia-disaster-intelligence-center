"""Rainfall endpoints — observasi curah hujan per lokasi + history."""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import fail, ok
from app.core.cache import cache_get_json, cache_set_json
from app.services.rainfall_service import (
    get_history,
    get_latest_all,
    get_latest_for_location,
)

router = APIRouter(prefix="/rainfall", tags=["rainfall"])

HISTORY_CACHE_TTL = 60  # detik


@router.get("")
async def list_rainfall(db: AsyncSession = Depends(get_db)) -> dict:
    """Observasi hujan terbaru untuk semua lokasi primer."""
    items = await get_latest_all(db)
    return ok(
        {
            "items": [i.model_dump(mode="json") for i in items],
            "total": len(items),
        },
        source="open-meteo",
    )


@router.get("/current", response_model=None)
async def current_rainfall(
    location_id: int = Query(..., description="ID lokasi"),
    db: AsyncSession = Depends(get_db),
) -> dict | JSONResponse:
    """Observasi hujan terbaru untuk satu lokasi."""
    item = await get_latest_for_location(db, location_id)
    if item is None:
        return JSONResponse(
            status_code=404,
            content=fail(
                "NOT_FOUND", f"Belum ada observasi untuk location_id={location_id}"
            ),
        )
    return ok(item.model_dump(mode="json"), source="open-meteo")


@router.get("/history", response_model=None)
async def rainfall_history(
    location_id: int = Query(..., description="ID lokasi"),
    hours: int = Query(24, ge=1, le=168, description="Rentang waktu (jam)"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Time series hujan satu lokasi — dasar chart tren (§10)."""
    key = f"rainfall:history:{location_id}:{hours}"
    cached = await cache_get_json(key)
    if cached is not None:
        return ok(cached, source="open-meteo")

    items = await get_history(db, location_id, hours)
    payload = {
        "items": [i.model_dump(mode="json") for i in items],
        "total": len(items),
    }
    await cache_set_json(key, payload, HISTORY_CACHE_TTL)
    return ok(payload, source="open-meteo")
