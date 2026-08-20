"""Endpoint kesehatan sistem — liveness + status komponen infrastruktur."""
from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.db.redis import ping_redis
from app.db.session import ping_database

router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    db_ok = await ping_database()
    redis_ok = await ping_redis()

    return {
        "success": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "status": "ok" if (db_ok and redis_ok) else "degraded",
            "app": settings.app_name,
            "environment": settings.environment,
            "version": settings.version,
            "components": {
                "database": "ok" if db_ok else "unavailable",
                "cache": "ok" if redis_ok else "unavailable",
            },
        },
    }