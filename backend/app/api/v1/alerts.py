"""Alerts endpoints — aktif & riwayat (§13)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.envelope import ok
from app.services.alert_service import get_active_alerts, get_alert_history

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(db: AsyncSession = Depends(get_db)) -> dict:
    """Alert aktif (belum expired), terbaru duluan."""
    items = await get_active_alerts(db)
    payload = {
        "items": [i.model_dump(mode="json") for i in items],
        "total": len(items),
    }
    return ok(payload, source="database")


@router.get("/history")
async def alert_history(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Riwayat alert (termasuk yang sudah expired), terbaru duluan."""
    items = await get_alert_history(db, limit)
    payload = {
        "items": [i.model_dump(mode="json") for i in items],
        "total": len(items),
    }
    return ok(payload, source="database")
