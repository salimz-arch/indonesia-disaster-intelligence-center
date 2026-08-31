"""Aggregator semua route API v1 — SATU-SATUNYA tempat registrasi router."""
from fastapi import APIRouter

from app.api.v1.ai import router as ai_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.earthquakes import router as earthquakes_router
from app.api.v1.export import router as export_router
from app.api.v1.health import router as health_router
from app.api.v1.locations import router as locations_router
from app.api.v1.radar import router as radar_router
from app.api.v1.rainfall import router as rainfall_router
from app.api.v1.sources import router as sources_router
from app.api.v1.stream import router as stream_router
from app.api.v1.system import router as system_router
from app.api.v1.weather import router as weather_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(earthquakes_router)
api_router.include_router(weather_router)
api_router.include_router(rainfall_router)
api_router.include_router(locations_router)
api_router.include_router(sources_router)
api_router.include_router(radar_router)
api_router.include_router(stream_router)
api_router.include_router(ai_router)
api_router.include_router(alerts_router)
api_router.include_router(analytics_router)
api_router.include_router(system_router)
api_router.include_router(export_router)
