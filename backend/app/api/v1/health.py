"""Endpoint kesehatan sistem."""
from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {
        "success": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "status": "ok",
            "app": settings.app_name,
            "environment": settings.environment,
            "version": settings.version,
        },
    }