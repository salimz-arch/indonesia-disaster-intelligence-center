"""System utility endpoints — cache management."""
from fastapi import APIRouter

from app.api.envelope import ok
from app.core.cache import cache_delete_pattern

router = APIRouter(prefix="/system", tags=["system"])

CACHE_PATTERNS = ["eq:*", "rainfall:*", "ai:*", "analytics:*", "radar:*"]

@router.post("/clear-cache")
async def clear_cache() -> dict:
    """Hapus cache Redis aplikasi → request berikutnya memuat data segar."""
    cleared = 0
    for pattern in CACHE_PATTERNS:
        cleared += await cache_delete_pattern(pattern)
    return ok({"cleared_keys": cleared}, source="redis")
