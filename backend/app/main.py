"""Entry point IDIC backend."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.error_middleware import ErrorHandlingMiddleware  # <-- IMPORT BARU
from app.core.logging import setup_logging
from app.db.redis import close_redis, init_redis, ping_redis
from app.db.session import dispose_engine, ping_database
from app.providers.base import close_http_client

settings = get_settings()
setup_logging(settings.log_level)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "startup",
        extra={"ctx": {"env": settings.environment, "version": settings.version}},
    )

    # ── Infrastructure check (fail-fast di production) ──
    await init_redis()
    db_ok = await ping_database()
    redis_ok = await ping_redis()
    if settings.environment == "production" and not (db_ok and redis_ok):
        raise RuntimeError(f"startup failed — database={db_ok}, redis={redis_ok}")
    logger.info(
        "infrastructure ready",
        extra={"ctx": {"database": db_ok, "redis": redis_ok}},
    )

    # ── Data collector ──
    if settings.scheduler_enabled:
        from app.collector.scheduler import start_scheduler

        start_scheduler()

    yield

    # ── Graceful shutdown ──
    if settings.scheduler_enabled:
        from app.collector.scheduler import stop_scheduler

        stop_scheduler()
    await close_http_client()
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

    # ── 1. CORS (Lapisan LUAR) ──
    # Dev: izinkan SEMUA port localhost (fleksibel utk npm run dev / next start -p XXXX)
    # Prod: pakai allowlist eksplisit dari .env
    if settings.is_dev:
        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+",
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],  # Ditambahkan OPTIONS
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],  # Ditambahkan OPTIONS
            allow_headers=["*"],
        )

    # ── 2. Error Handler (Lapisan DALAM) ──
    # Menangkap exception (misal DB timeout) dan mengembalikan 503 JSON.
    # Karena ditaruh SETELAH CORS, response error ini tetap akan memiliki
    # header CORS yang valid, mencegah error palsu di browser.
    app.add_middleware(ErrorHandlingMiddleware)

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
