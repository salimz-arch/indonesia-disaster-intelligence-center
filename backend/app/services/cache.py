"""Cache JSON Redis untuk read path — cache mati ≠ endpoint mati.

Setiap operasi dibungkus try/except: bila Redis down, endpoint tetap
melayani dari database. Cache dinonaktifkan otomatis saat
ENVIRONMENT=test agar test deterministik (tidak terpolusi cache dev).
"""

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from app.core.config import get_settings
from app.db import redis as redis_state

logger = logging.getLogger("app.services.cache")


def _disabled() -> bool:
    return get_settings().environment == "test"


async def cache_get(key: str) -> Any | None:
    if _disabled() or redis_state.redis_client is None:
        return None
    try:
        raw = await redis_state.redis_client.get(key)
        return json.loads(raw) if raw else None
    except Exception as exc:
        logger.warning("cache get gagal (diabaikan): %s", exc.__class__.__name__)
        return None


async def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    if _disabled() or redis_state.redis_client is None:
        return
    try:
        await redis_state.redis_client.set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except Exception as exc:
        logger.warning("cache set gagal (diabaikan): %s", exc.__class__.__name__)


async def cached(key: str, ttl_seconds: int, fetch: Callable[[], Awaitable[Any]]) -> Any:
    """Ambil dari cache; miss → fetch → simpan. `fetch` wajib return
    struktur JSON-able. Exception dari fetch diteruskan (tidak di-cache)."""
    data = await cache_get(key)
    if data is not None:
        return data
    data = await fetch()
    await cache_set(key, data, ttl_seconds)
    return data
