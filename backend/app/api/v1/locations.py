"""Locations endpoints — untuk search & flyTo frontend (§22)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import ok
from app.services.location_service import list_locations

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("")
async def get_locations(db: AsyncSession = Depends(get_db)) -> dict:
    items = await list_locations(db)
    return ok(
        {
            "items": [i.model_dump(mode="json") for i in items],
            "total": len(items),
        },
        source="database",
    )
