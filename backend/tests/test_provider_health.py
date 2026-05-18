"""Tests for the provider health and management endpoints."""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_providers_list():
    resp = client.get("/api/providers/")
    assert resp.status_code == 200
    assert "providers" in resp.json()


def test_add_empty_keys_fails():
    resp = client.post(
        "/api/providers/keys",
        json={"provider": "anthropic", "keys": []}
    )
    assert resp.status_code == 400


def test_add_whitespace_key_fails():
    resp = client.post(
        "/api/providers/keys",
        json={"provider": "anthropic", "keys": ["   "]}
    )
    assert resp.status_code == 400


def test_add_unknown_provider_fails():
    resp = client.post(
        "/api/providers/keys",
        json={"provider": "imaginary-provider", "keys": ["key123"]}
    )
    assert resp.status_code == 400


def test_remove_unknown_provider_fails():
    resp = client.delete(
        "/api/providers/keys",
        content='{"provider":"nonexistent","keys":["k"]}',
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 400


def test_health_endpoint():
    resp = client.get("/api/providers/health")
    assert resp.status_code == 200
    assert "providers" in resp.json()


def test_set_preferred_order():
    resp = client.post(
        "/api/providers/preferred",
        json={"order": ["anthropic", "openai"]}
    )
    assert resp.status_code == 200
    assert "order" in resp.json()
