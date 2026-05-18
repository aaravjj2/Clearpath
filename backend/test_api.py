"""Integration tests for ClearPath API endpoints."""

import os
from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
