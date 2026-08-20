"""Fixtures test database — PostgreSQL `idic_test` (dibuat/dihapus otomatis).

Terisolasi penuh dari database development. Skip otomatis jika
server PostgreSQL tidak berjalan (unit test tetap dieksekusi).
"""
import asyncio
import sys
from pathlib import Path

import pytest
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import app.models  # noqa: F401  (register semua model)
from app.core.config import get_settings
from app.db.base import Base

# Derivasi URL test dari settings — ikut kalau user ganti port/kredensial
_base_url = get_settings().database_url.rsplit("/", 1)[0]
PG_ADMIN_URL = f"{_base_url}/idic"
TEST_DB_NAME = "idic_test"
TEST_DB_URL = f"{_base_url}/{TEST_DB_NAME}"


def _server_available() -> bool:
    async def _check() -> bool:
        engine = create_async_engine(PG_ADMIN_URL)
        try:
            async with engine.connect():
                return True
        except Exception:
            return False
        finally:
            await engine.dispose()

    return asyncio.run(_check())


@pytest.fixture(scope="session")
def test_db():
    """Buat database test + semua tabel (sekali per sesi), hapus di akhir."""
    if not _server_available():
        pytest.skip("PostgreSQL tidak berjalan — jalankan: docker compose up -d")

    async def _setup() -> None:
        admin = create_async_engine(PG_ADMIN_URL, isolation_level="AUTOCOMMIT")
        async with admin.connect() as conn:
            await conn.execute(
                sa.text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME} WITH (FORCE)")
            )
            await conn.execute(sa.text(f"CREATE DATABASE {TEST_DB_NAME}"))
        await admin.dispose()

        engine = create_async_engine(TEST_DB_URL)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    async def _teardown() -> None:
        admin = create_async_engine(PG_ADMIN_URL, isolation_level="AUTOCOMMIT")
        async with admin.connect() as conn:
            await conn.execute(
                sa.text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME} WITH (FORCE)")
            )
        await admin.dispose()

    asyncio.run(_setup())
    yield
    asyncio.run(_teardown())


@pytest.fixture
async def db_session(test_db):
    """Satu session per test; tabel dibersihkan setelahnya (isolasi antar test)."""
    engine = create_async_engine(TEST_DB_URL)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session

    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(
                sa.text(f'TRUNCATE TABLE "{table.name}" RESTART IDENTITY CASCADE')
            )
    await engine.dispose()
