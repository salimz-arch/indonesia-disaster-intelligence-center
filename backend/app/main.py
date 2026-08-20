"""Entry point IDIC backend."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.redis import close_redis, init_redis, ping_redis
from app.db.session import dispose_engine, ping_database

settings = get_settings()
setup_logging(settings.log_level)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "startup",
        extra={"ctx": {"env": settings.environment, "version": settings.version}},
    )

    # ── Infrastructure check ──
    await init_redis()  # warning internal jika gagal (dev: lanjut)
    db_ok = await ping_database()
    redis_ok = await ping_redis()

    if settings.environment == "production" and not (db_ok and redis_ok):
        # Fail-fast: production tidak boleh berjalan setengah hidup
        raise RuntimeError(f"startup failed — database={db_ok}, redis={redis_ok}")

    logger.info(
        "infrastructure ready",
        extra={"ctx": {"database": db_ok, "redis": redis_ok}},
    )

    # Step 5: APScheduler (data collector) start di sini
    yield

    # ── Graceful shutdown ──
    await close_redis()
    await dispose_engine()
    logger.info("shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()