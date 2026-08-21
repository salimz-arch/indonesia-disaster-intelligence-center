"""Redis cache helpers — no-op aman saat Redis tidak tersedia.

Mengimpor MODULE app.db.redis (bukan simbolnya) agar assignment
redis_client oleh init_redis() terlihat di sini.
"""
import json
import logging
from typing import Any

from app.db import redis as redis_module

logger = logging.getLogger("app.core.cache")


async def cache_get_json(key: str) -> Any | None:
    client = redis_module.redis_client
    if client is None:
        return None
    try:
        raw = await client.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        logger.warning("cache_get gagal utk key %s — fallback", key)
        return None


async def cache_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    client = redis_module.redis_client
    if client is None:
        return
    try:
        await client.set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except Exception:
        logger.warning("cache_set gagal utk key %s — dilewati", key)


async def cache_delete_pattern(pattern: str) -> None:
    """Hapus keys matching pattern — invalidasi cache saat ingest baru."""
    client = redis_module.redis_client
    if client is None:
        return
    try:
        keys = [key async for key in client.scan_iter(match=pattern)]
        if keys:
            await client.delete(*keys)
    except Exception:
        logger.warning("cache_delete_pattern gagal utk %s — dilewati", pattern)


