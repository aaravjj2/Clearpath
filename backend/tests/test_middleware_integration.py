"""Integration tests verifying middleware stack works together."""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_request_id_uuid_format():
    """X-Request-ID should be a valid UUID."""
    import uuid
    resp = client.get("/health")
    req_id = resp.headers.get("x-request-id", "")
    try:
        uuid.UUID(req_id)
        is_valid = True
    except ValueError:
        is_valid = False
    assert is_valid, f"Invalid UUID: {req_id!r}"


def test_custom_request_id_preserved():
    resp = client.get("/health", headers={"X-Request-ID": "my-trace-id-123"})
    assert resp.headers.get("x-request-id") == "my-trace-id-123"


def test_content_type_header_on_json():
    resp = client.get("/health")
    assert "application/json" in resp.headers.get("content-type", "")


def test_cors_not_present_without_origin():
    """No CORS headers without Origin header."""
    resp = client.get("/health")
    assert "access-control-allow-origin" not in resp.headers


def test_cors_present_with_allowed_origin():
    resp = client.get("/health", headers={"Origin": "http://localhost:3000"})
    # CORS allowed origins include localhost:3000
    assert "access-control-allow-origin" in resp.headers


def test_all_security_headers():
    resp = client.get("/health")
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("referrer-policy") is not None
