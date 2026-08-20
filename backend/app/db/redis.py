"""Redis client lifecycle — cache hot data (mulai Step 5).

Filosofi: Redis adalah akselerator, bukan kebutuhan hidup.
- development : aplikasi tetap jalan tanpa Redis (cache mati)
- production  : fail-fast saat startup (dijalankan di main.py)
"""
import logging

import redis.asyncio as redis

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("app.db.redis")

redis_client: redis.Redis | None = None


def _new_client() -> redis.Redis:
    return redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )


async def init_redis() -> redis.Redis | None:
    """Inisialisasi client global. Return None jika gagal (dev-safe)."""
    global redis_client
    try:
        client = _new_client()
        await client.ping()
        redis_client = client
        return client
    except Exception as exc:
        logger.warning(
            "redis unavailable — cache disabled (%s)",
            exc.__class__.__name__,
        )
        redis_client = None
        return None


async def close_redis() -> None:
    """Tutup client saat shutdown."""
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None


async def ping_redis() -> bool:
    """Cek koneksi Redis — pakai client aktif, atau koneksi ephemeral."""
    try:
        if redis_client is not None:
            await redis_client.ping()
            return True
        client = _new_client()
        try:
            await client.ping()
        finally:
            await client.aclose()
        return True
    except Exception as exc:
        logger.warning(
            "redis ping failed — %s: %s", exc.__class__.__name__, exc
        )
        return False
