"""Smoke test: health endpoint + format envelope."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_success_envelope():
    res = client.get("/api/v1/health")
    assert res.status_code == 200

    body = res.json()
    assert body["success"] is True
    assert "timestamp" in body          # envelope wajib punya timestamp
    assert body["data"]["status"] == "ok"
    assert body["data"]["environment"] == "development"
    assert body["data"]["version"]


def test_unknown_route_returns_404():
    res = client.get("/api/v1/does-not-exist")
    assert res.status_code == 404