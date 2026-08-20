"""Smoke test: envelope + status komponen infrastruktur."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_success_envelope():
    res = client.get("/api/v1/health")
    assert res.status_code == 200

    body = res.json()
    assert body["success"] is True
    assert "timestamp" in body
    assert body["data"]["status"] in ("ok", "degraded")
    assert body["data"]["version"]


def test_health_reports_components():
    body = client.get("/api/v1/health").json()
    components = body["data"]["components"]

    assert set(components) == {"database", "cache"}
    assert all(v in ("ok", "unavailable") for v in components.values())


def test_health_ok_when_infra_running():
    """Bermakna penuh hanya jika infra Docker berjalan."""
    body = client.get("/api/v1/health").json()
    if body["data"]["components"]["database"] == "unavailable":
        pytest.skip("PostgreSQL tidak berjalan — jalankan: docker compose up -d")
    assert body["data"]["status"] == "ok"


def test_unknown_route_returns_404():
    assert client.get("/api/v1/does-not-exist").status_code == 404