"""API contract tests — envelope konsisten di seluruh endpoint GET (§35).

Skip otomatis bila PostgreSQL dev tidak berjalan (endpoint membaca DB).
Endpoint /radar sengaja tidak diuji di sini — memukul jaringan eksternal.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import _server_available

pytestmark = pytest.mark.skipif(
    not _server_available(), reason="PostgreSQL tidak berjalan"
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


GET_ENDPOINTS = [
    "/api/v1/earthquakes/latest",
    "/api/v1/earthquakes?hours=24&limit=5",
    "/api/v1/earthquakes/stats?hours=24",
    "/api/v1/weather",
    "/api/v1/rainfall",
    "/api/v1/locations",
    "/api/v1/sources",
    "/api/v1/alerts",
    "/api/v1/alerts/history",
    "/api/v1/analytics/earthquakes?days=7",
    "/api/v1/analytics/rainfall?days=7",
    "/api/v1/analytics/weather?days=7",
]


@pytest.mark.parametrize("path", GET_ENDPOINTS)
def test_envelope_contract(client, path):
    """Semua endpoint: success=true + timestamp + source + data."""
    res = client.get(path)
    assert res.status_code == 200

    body = res.json()
    assert body["success"] is True
    assert "timestamp" in body
    assert "source" in body
    assert isinstance(body["data"], (dict, list))


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/earthquakes?hours=0",
        "/api/v1/earthquakes/latest?limit=0",
        "/api/v1/analytics/earthquakes?days=91",
        "/api/v1/alerts/history?limit=500",
    ],
)
def test_invalid_query_returns_422(client, path):
    """Param di luar batas → 422 (FastAPI validation)."""
    assert client.get(path).status_code == 422


def test_current_weather_404_uses_error_envelope(client):
    """Not found → envelope error, bukan detail polos."""
    res = client.get("/api/v1/weather/current?location_id=999999")
    assert res.status_code == 404

    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["message"]


async def test_stream_response_headers():
    """SSE endpoint: media type + headers anti-buffering — tanpa consume stream."""
    from app.api.v1.stream import stream

    resp = await stream()
    assert resp.media_type == "text/event-stream"
    assert resp.headers["cache-control"] == "no-cache"
    assert resp.headers["x-accel-buffering"] == "no"
