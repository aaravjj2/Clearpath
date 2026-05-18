"""Tests for health check endpoints."""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_basic():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_health_service_name():
    resp = client.get("/health")
    assert resp.json()["service"] == "ClearPath API"


def test_health_detailed_ok():
    resp = client.get("/health/detailed")
    assert resp.status_code == 200


def test_health_detailed_fields():
    resp = client.get("/health/detailed")
    data = resp.json()
    assert "version" in data
    assert "environment" in data
    assert "rate_limit_rpm" in data
    assert "providers" in data
    assert isinstance(data["providers"], list)


def test_health_response_time_fast():
    import time
    start = time.perf_counter()
    client.get("/health")
    elapsed = time.perf_counter() - start
    assert elapsed < 1.0, f"Health check too slow: {elapsed:.2f}s"
