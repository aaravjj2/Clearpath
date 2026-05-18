"""Integration tests for ClearPath API endpoints."""

import os
from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from main import app
from services.providers import reset_registry

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_provider_registry():
    """Reset the AI provider registry before each test to prevent state bleed."""
    reset_registry()
    yield
    reset_registry()


def test_health():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ClearPath API"}


def test_upload_missing_input():
    """Test upload endpoint with no file or text."""
    response = client.post("/api/documents/upload", data={})
    assert response.status_code == 400


def test_upload_with_text():
    """Test document upload with plain text."""
    text_content = """1. Payment Terms
    The tenant must pay $1000 per month.
    
    2. Early Termination
    If the tenant leaves early, they forfeit all deposits.
    
    3. Landlord Entry
    The landlord may enter at any time without notice."""
    
    response = client.post(
        "/api/documents/upload",
        data={"text": text_content}
    )
    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert data["filename"] == "pasted_document.txt"
    assert len(data["document_id"]) > 0


def test_stream_analysis_not_found():
    """Test streaming analysis of non-existent document."""
    response = client.get("/api/documents/nonexistent/stream")
    assert response.status_code == 404


def test_summary_not_found():
    """Test summary of non-existent document."""
    response = client.get("/api/documents/nonexistent/summary")
    assert response.status_code == 404


def test_chat_not_indexed():
    """Test chat endpoint without indexed document."""
    response = client.post(
        "/api/chat/",
        json={
            "document_id": "nonexistent",
            "message": "What are the payment terms?",
            "history": []
        }
    )
    assert response.status_code == 404


def test_api_router_integration():
    """Verify all routes are accessible."""
    routes = [route.path for route in app.routes]
    assert "/health" in routes
    assert "/api/documents/upload" in routes
    assert "/api/documents/{document_id}/stream" in routes
    assert "/api/documents/{document_id}/summary" in routes
    assert "/api/chat/" in routes


def test_health_detailed():
    """Test detailed health endpoint returns expected fields."""
    response = client.get("/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "providers" in data
    assert isinstance(data["providers"], list)


def test_security_headers_present():
    """Security headers should be on all responses."""
    response = client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"


def test_upload_fake_pdf():
    """Non-PDF file disguised as PDF returns 415."""
    response = client.post(
        "/api/documents/upload",
        files={"file": ("malicious.pdf", b"THIS IS NOT A PDF", "application/pdf")}
    )
    assert response.status_code == 415


def test_upload_text_too_large():
    """Test that oversized text is rejected with 413."""
    huge_text = "A" * 600_000  # Exceeds MAX_TEXT_CHARS=500_000
    response = client.post("/api/documents/upload", data={"text": huge_text})
    assert response.status_code == 413


def test_delete_document_not_found():
    """Delete non-existent document returns 404."""
    response = client.delete("/api/documents/nonexistent")
    assert response.status_code == 404


def test_delete_document_success():
    """Upload then delete a document."""
    upload = client.post("/api/documents/upload", data={"text": "A" * 60})
    assert upload.status_code == 200
    doc_id = upload.json()["document_id"]
    delete_resp = client.delete(f"/api/documents/{doc_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "deleted"
    # Summary now 404
    summary = client.get(f"/api/documents/{doc_id}/summary")
    assert summary.status_code == 404


def test_chat_empty_message():
    """Empty message returns 400."""
    response = client.post(
        "/api/chat/",
        json={"document_id": "any", "message": "", "history": []}
    )
    assert response.status_code == 400


def test_chat_whitespace_message():
    """Whitespace-only message returns 400."""
    response = client.post(
        "/api/chat/",
        json={"document_id": "any", "message": "   ", "history": []}
    )
    assert response.status_code == 400


def test_query_empty_collection():
    """Test that querying an un-indexed document returns empty list."""
    from services.vectorstore import query_document
    result = query_document("nonexistent-doc", "payment terms", n_results=3)
    assert result == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
