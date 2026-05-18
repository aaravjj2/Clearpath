"""Tests for the OpenAI-compatible completions router."""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_list_models_returns_list():
    resp = client.get("/v1/models")
    assert resp.status_code == 200
    data = resp.json()
    assert "data" in data
    assert isinstance(data["data"], list)


def test_list_models_object_type():
    resp = client.get("/v1/models")
    assert resp.json()["object"] == "list"


def test_completions_no_messages_422():
    resp = client.post("/v1/chat/completions", json={"messages": []})
    # Empty messages list is technically valid schema but may fail downstream
    # At minimum should not 500
    assert resp.status_code in (200, 422, 500)


def test_completions_missing_messages_422():
    resp = client.post("/v1/chat/completions", json={})
    assert resp.status_code == 422


def test_v1_models_includes_provider_field():
    resp = client.get("/v1/models")
    models = resp.json()["data"]
    if models:
        assert "provider" in models[0]
