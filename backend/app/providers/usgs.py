"""USGS FDSN provider — gempa bulk/window untuk bbox Indonesia (publik, tanpa key).

Menyediakan kepadatan event (M2.5+) yang tidak dicover feed realtime BMKG,
termasuk backfill historis untuk modul analytics.
"""

import logging
from datetime import UTC, datetime, timedelta

from pydantic import ValidationError

from app.providers.base import EarthquakeProvider, fetch_json
from app.schemas.earthquake import EarthquakeCreate

logger = logging.getLogger("app.providers.usgs")

QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

# Bbox Indonesia (padding, tetap dalam rentang validasi canonical schema)
BBOX = {
    "minlatitude": -11.0,
    "maxlatitude": 6.0,
    "minlongitude": 95.0,
    "maxlongitude": 141.0,
}


def parse_feature(feature: dict) -> EarthquakeCreate | None:
    """Normalisasi satu feature GeoJSON USGS → canonical."""
    try:
        props = feature["properties"]
        magnitude = props.get("mag")
        if magnitude is None:
            return None
        # GeoJSON: [longitude, latitude, depth_km] — urutan SENGAJA dibalik
        lon, lat, depth = feature["geometry"]["coordinates"]

        place = props.get("place") or ""
        region = place.split(",")[-1].strip() if "," in place else (place or None)

        return EarthquakeCreate(
            provider="usgs",
            source_id=str(feature.get("id") or f"usgs-{props.get('time', 'unknown')}"),
            magnitude=float(magnitude),
            depth_km=float(depth),
            latitude=float(lat),
            longitude=float(lon),
            location_text=place or None,
            region=region,
            event_time=datetime.fromtimestamp(props["time"] / 1000, tz=UTC),
            potential_tsunami=bool(props.get("tsunami")),
        )
    except (KeyError, ValueError, TypeError, ValidationError) as exc:
        logger.warning("USGS event dilewati (invalid): %s", exc)
        return None


class USGSEarthquakeProvider(EarthquakeProvider):
    name = "usgs-earthquake"

    async def fetch_window(self, start: datetime, end: datetime) -> list[EarthquakeCreate]:
        params = {
            "format": "geojson",
            "starttime": start.strftime("%Y-%m-%dT%H:%M:%S"),
            "endtime": end.strftime("%Y-%m-%dT%H:%M:%S"),
            "orderby": "time-asc",
            "minmagnitude": 2.5,
            "limit": 2000,
            **BBOX,
        }
        payload = await fetch_json(QUERY_URL, params=params)
        events = []
        for feature in (payload or {}).get("features", []):
            parsed = parse_feature(feature)
            if parsed is not None:
                events.append(parsed)
        return events

    async def fetch(self) -> list[EarthquakeCreate]:
        """Window default 1 jam — interface seragam EarthquakeProvider."""
        end = datetime.now(UTC)
        return await self.fetch_window(end - timedelta(hours=1), end)
