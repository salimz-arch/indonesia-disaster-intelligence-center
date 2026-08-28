"""Weather endpoints — observasi cuaca terkini per lokasi."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import fail, ok
from app.services.weather_service import get_latest_all, get_latest_for_location

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("")
async def list_weather(db: AsyncSession = Depends(get_db)) -> dict:
    """Observasi cuaca terbaru untuk semua lokasi primer."""
    items = await get_latest_all(db)
    return ok(
        {
            "items": [i.model_dump(mode="json") for i in items],
            "total": len(items),
        },
        source="open-meteo",
    )


@router.get("/current", response_model=None)
async def current_weather(
    location_id: int = Query(..., description="ID lokasi"),
    db: AsyncSession = Depends(get_db),
) -> dict | JSONResponse:
    """Observasi terbaru untuk satu lokasi."""
    item = await get_latest_for_location(db, location_id)
    if item is None:
        return JSONResponse(
            status_code=404,
            content=fail("NOT_FOUND", f"Belum ada observasi untuk location_id={location_id}"),
        )
    return ok(item.model_dump(mode="json"), source="open-meteo")
