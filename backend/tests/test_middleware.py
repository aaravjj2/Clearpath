"""Tests for custom middleware: rate limiting, request-ID, security headers."""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_request_id_header_present():
    """Every response should carry X-Request-ID."""
    resp = client.get("/health")
    assert "x-request-id" in resp.headers


def test_request_id_echoed():
    """If client sends X-Request-ID, it should be echoed back."""
    resp = client.get("/health", headers={"X-Request-ID": "test-trace-123"})
    assert resp.headers.get("x-request-id") == "test-trace-123"


def test_security_headers():
    """X-Content-Type-Options and X-Frame-Options must be present."""
    resp = client.get("/health")
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"


def test_rate_limit_header_on_normal_request():
    """Normal requests should not hit rate limit."""
    resp = client.get("/health")
    assert resp.status_code == 200
