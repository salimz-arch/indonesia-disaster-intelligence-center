"""RainViewer provider — metadata frame radar hujan (publik, tanpa key).

Hanya metadata frame (host + path); tile PNG dimuat langsung oleh MapLibre
di frontend. Endpoint /radar memakai ini untuk animasi frame.
"""
import logging
from typing import Any

from app.providers.base import fetch_json

logger = logging.getLogger("app.providers.rainviewer")

WEATHER_MAPS_URL = "https://api.rainviewer.com/public/weather-maps.json"


class RainViewerProvider:
    name = "rainviewer-radar"

    async def fetch_frames(self) -> dict[str, Any]:
        payload = await fetch_json(WEATHER_MAPS_URL)
        radar = payload.get("radar") or {}
        frames: list[dict[str, Any]] = []
        for kind in ("past", "nowcast"):
            for frame in radar.get(kind) or []:
                frames.append(
                    {
                        "time": frame.get("time"),
                        "path": frame.get("path"),
                        "kind": kind,
                    }
                )
        return {
            "host": payload.get("host", "https://tilecache.rainviewer.com"),
            "frames": frames,
        }
