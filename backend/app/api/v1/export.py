"""Export endpoints — unduh data monitoring sebagai CSV / JSON.

CSV: Excel-friendly (UTF-8 BOM), waktu dikonversi ke WIB.
JSON: struktur {exported_at, dataset, total, items}.
"""
import csv
import io
import json
from datetime import UTC, datetime, timedelta
from typing import Any

import sqlalchemy as sa
from fastapi import APIRouter, Depends, Path, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import Location
from app.services.earthquake_service import get_recent
from app.services.rainfall_service import get_latest_all as rainfall_latest
from app.services.weather_service import get_latest_all as weather_latest

router = APIRouter(prefix="/export", tags=["export"])

MAX_EXPORT_ROWS = 5000


def _to_wib(value: datetime) -> str:
    """UTC aware → 'YYYY-MM-DD HH:MM:SS' (wall time WIB)."""
    return (value + timedelta(hours=7)).strftime("%Y-%m-%d %H:%M:%S")


def _csv_response(
    rows: list[list[Any]], header: list[str], filename: str
) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(header)
    writer.writerows(rows)
    # UTF-8 BOM: karakter Indonesia tampil benar saat dibuka Excel
    return Response(
        content="\ufeff" + output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _json_response(payload: dict, filename: str) -> Response:
    return Response(
        content=json.dumps(payload, indent=2, ensure_ascii=False, default=str),
        media_type="application/json; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _location_map(db: AsyncSession) -> dict[int, str]:
    rows = (await db.scalars(sa.select(Location))).all()
    return {loc.id: loc.name for loc in rows}


@router.get("/{dataset}")
async def export_data(
    dataset: str = Path(..., pattern="^(earthquakes|weather|rainfall)$"),
    fmt: str = Query("csv", alias="format", pattern="^(csv|json)$"),
    hours: int = Query(24, ge=1, le=2160, description="Hanya untuk earthquakes"),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Unduh data monitoring sebagai file (bukan envelope API)."""
    stamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    exported_at = datetime.now(UTC).isoformat()

    if dataset == "earthquakes":
        items, _total = await get_recent(db, hours=hours, limit=MAX_EXPORT_ROWS)
        header = [
            "id", "provider", "magnitude", "depth_km", "latitude",
            "longitude", "location_text", "region", "event_time_wib",
            "category", "potential_tsunami",
        ]
        rows = [
            [
                e.id, e.provider, e.magnitude, e.depth_km, e.latitude,
                e.longitude, e.location_text, e.region, _to_wib(e.event_time),
                e.category.value, e.potential_tsunami,
            ]
            for e in items
        ]
        json_items = [e.model_dump(mode="json") for e in items]
        meta = {"dataset": "earthquakes", "hours": hours, "total": len(items)}

    elif dataset == "weather":
        items = await weather_latest(db)
        loc_map = await _location_map(db)
        header = [
            "location_name", "temperature_c", "feels_like_c", "humidity_pct",
            "pressure_hpa", "wind_speed_kmh", "condition_code",
            "condition_text", "precipitation_mm", "observed_at_wib",
        ]
        rows = [
            [
                loc_map.get(w.location_id, str(w.location_id)),
                w.temperature_c, w.feels_like_c, w.humidity_pct,
                w.pressure_hpa, w.wind_speed_kmh, w.condition_code.value,
                w.condition_text, w.precipitation_mm, _to_wib(w.observed_at),
            ]
            for w in items
        ]
        json_items = [w.model_dump(mode="json") for w in items]
        meta = {"dataset": "weather", "total": len(items)}

    else:  # rainfall
        items = await rainfall_latest(db)
        loc_map = await _location_map(db)
        header = [
            "location_name", "rainfall_1h_mm", "rainfall_6h_mm",
            "rainfall_24h_mm", "intensity", "observed_at_wib",
        ]
        rows = [
            [
                loc_map.get(r.location_id, str(r.location_id)),
                r.rainfall_1h_mm, r.rainfall_6h_mm, r.rainfall_24h_mm,
                r.intensity.value, _to_wib(r.observed_at),
            ]
            for r in items
        ]
        json_items = [r.model_dump(mode="json") for r in items]
        meta = {"dataset": "rainfall", "total": len(items)}

    filename = f"idic_{dataset}_{stamp}.{fmt}"

    if fmt == "csv":
        return _csv_response(rows, header, filename)
    return _json_response(
        {"exported_at": exported_at, **meta, "items": json_items}, filename
    )
