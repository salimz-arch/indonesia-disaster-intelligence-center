"""APScheduler lifecycle — AsyncIO, immediate-first-run, one-shot backfill."""

import logging
from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.collector import tasks
from app.core.config import get_settings

logger = logging.getLogger("app.collector.scheduler")

_scheduler: AsyncIOScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    settings = get_settings()
    scheduler = AsyncIOScheduler(timezone="UTC")

    # next_run_time=now → siklus PERTAMA langsung jalan saat startup
    scheduler.add_job(
        tasks.collect_bmkg,
        "interval",
        seconds=settings.earthquake_refresh_seconds,
        next_run_time=datetime.now(UTC),
        id="bmkg",
        max_instances=1,
        coalesce=True,
    )
    scheduler.add_job(
        tasks.collect_usgs,
        "interval",
        seconds=settings.usgs_refresh_seconds,
        next_run_time=datetime.now(UTC),
        id="usgs",
        max_instances=1,
        coalesce=True,
    )
    scheduler.add_job(
        tasks.collect_weather,
        "interval",
        seconds=settings.weather_refresh_seconds,
        next_run_time=datetime.now(UTC),
        id="weather",
        max_instances=1,
        coalesce=True,
    )
    # Backfill 7 hari: sekali, 5 detik setelah startup (untuk analytics)
    scheduler.add_job(
        tasks.collect_usgs_backfill,
        "date",
        run_date=datetime.now(UTC) + timedelta(seconds=5),
        id="usgs-backfill",
    )

    scheduler.start()
    _scheduler = scheduler
    logger.info("scheduler started — jobs: %s", [j.id for j in scheduler.get_jobs()])


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("scheduler stopped")
