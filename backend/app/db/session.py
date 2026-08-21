"""Async SQLAlchemy engine & session factory — abstraksi database.

Default development: PostgreSQL (Docker) — konsisten dengan production.
Fallback tanpa Docker: SQLite (lihat .env.example).
Engine bersifat lazy — dibuat saat import, koneksi dibuka saat dipakai.
"""

from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()

_engine_kwargs: dict = {"echo": False, "pool_pre_ping": True}
if settings.database_url.startswith("postgres"):
    _engine_kwargs |= {"pool_size": 5, "max_overflow": 10}

engine = create_async_engine(settings.database_url, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency FastAPI — satu session per request (dipakai mulai Step 5)."""
    async with AsyncSessionLocal() as session:
        yield session


async def ping_database() -> bool:
    """Cek koneksi database via SELECT 1 — untuk health endpoint."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def dispose_engine() -> None:
    """Tutup semua koneksi pool saat shutdown."""
    await engine.dispose()
