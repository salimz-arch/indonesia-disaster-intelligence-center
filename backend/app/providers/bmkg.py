"""BMKG TEWS provider — gempa realtime Indonesia (API publik resmi, tanpa key).

autogempa.json   = event terbaru (objek tunggal)
gempaterkini.json = 15 event terakhir M5.0+
Partial failure ditoleransi: satu endpoint gagal → endpoint lain tetap dipakai.
"""

import logging
from datetime import datetime

from pydantic import ValidationError

from app.core.exceptions import ProviderError
from app.providers.base import EarthquakeProvider, fetch_json
from app.schemas.earthquake import EarthquakeCreate

logger = logging.getLogger("app.providers.bmkg")

BASE_URL = "https://data.bmkg.go.id/DataMKG/TEWS"


def parse_gempa(raw: dict) -> EarthquakeCreate | None:
    """Normalisasi satu event BMKG → canonical. None jika invalid (dilewati)."""
    try:
        lat_str, lon_str = raw["Coordinates"].split(",")
        potensi = (raw.get("Potensi") or "").strip().lower()
        # BMKG pernah memakai "Magnitude" dan "Magnitudo" — handle keduanya
        magnitude_raw = raw.get("Magnitude") or raw.get("Magnitudo")
        if magnitude_raw is None:
            return None

        wilayah = raw.get("Wilayah") or ""
        # Region hanya dari format DASH (X-Y-Z): segmen terakhir = kode provinsi.
        # Format tanpa dash → region = None → frontend derive dari location_text.
        region = None
        segments = [s.strip() for s in wilayah.split("-") if s.strip()]
        if len(segments) > 1:
            last = segments[-1]
            if (
                len(last) >= 3
                and not last[0].isdigit()
                and "km" not in last.lower()
            ):
                region = last
        return EarthquakeCreate(
            provider="bmkg",
            # BMKG tak punya ID stabil → composite deterministik (dedup tetap jalan)
            source_id=f"{raw['DateTime']}|{raw['Coordinates']}",
            magnitude=float(magnitude_raw),
            depth_km=float(str(raw["Kedalaman"]).split()[0]),
            latitude=float(lat_str),
            longitude=float(lon_str),
            location_text=wilayah or None,
            region=region,
            event_time=datetime.fromisoformat(raw["DateTime"]),
            # "tidak berpotensi TSUNAMI" MENGANDUNG kata "berpotensi" — cek prefix!
            potential_tsunami=("tsunami" in potensi) and (not potensi.startswith("tidak")),
        )
    except (KeyError, ValueError, TypeError, IndexError, ValidationError) as exc:
        logger.warning("BMKG event dilewati (invalid): %s", exc)
        return None


class BMKGEarthquakeProvider(EarthquakeProvider):
    name = "bmkg-earthquake"

    async def fetch(self) -> list[EarthquakeCreate]:
        raw_events: list[dict] = []
        failures: list[str] = []

        for endpoint in ("autogempa.json", "gempaterkini.json"):
            try:
                payload = await fetch_json(f"{BASE_URL}/{endpoint}")
            except ProviderError as exc:
                failures.append(f"{endpoint}: {exc.message}")
                continue
            gempa = (payload or {}).get("Infogempa", {}).get("gempa")
            if isinstance(gempa, dict):
                raw_events.append(gempa)
            elif isinstance(gempa, list):
                raw_events.extend(gempa)

        if not raw_events and failures:
            raise ProviderError("semua endpoint BMKG gagal — " + "; ".join(failures))
        if failures:
            logger.warning("BMKG partial failure: %s", failures)

        events: list[EarthquakeCreate] = []
        seen: set[str] = set()
        for raw in raw_events:
            parsed = parse_gempa(raw)
            if parsed is not None and parsed.source_id not in seen:
                seen.add(parsed.source_id)
                events.append(parsed)
        return events
