"""Data source status endpoints — Data Source Transparency (§40)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import ok
from app.services.source_service import list_sources

router = APIRouter(prefix="/sources", tags=["system"])


@router.get("")
async def get_sources(db: AsyncSession = Depends(get_db)) -> dict:
    items = await list_sources(db)
    return ok(
        {
            "items": [i.model_dump(mode="json") for i in items],
            "total": len(items),
        },
        source="database",
    )
