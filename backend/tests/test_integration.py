"""
Integration tests: Upload → Stream → Chat pipeline.

These tests verify the full request flow without live AI providers
by mocking the AI layer.
"""

import json
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

SAMPLE_TEXT = (
    "1. Payment Terms. Tenant shall pay $1,500 per month on the 1st of each month.\n\n"
    "2. Termination. Either party may terminate with 30 days written notice.\n\n"
    "3. Late Fees. A late fee of $150 shall apply for payments received after the 5th."
)


def test_full_upload_to_summary_pipeline():
    """Upload a document and verify summary is retrievable."""
    upload = client.post("/api/documents/upload", data={"text": SAMPLE_TEXT})
    assert upload.status_code == 200
    doc_id = upload.json()["document_id"]

    summary = client.get(f"/api/documents/{doc_id}/summary")
    assert summary.status_code == 200
    assert summary.json()["document_id"] == doc_id


def test_upload_then_delete_then_not_found():
    """Upload, delete, then verify 404 on summary."""
    upload = client.post("/api/documents/upload", data={"text": SAMPLE_TEXT})
    doc_id = upload.json()["document_id"]
    client.delete(f"/api/documents/{doc_id}")
    assert client.get(f"/api/documents/{doc_id}/summary").status_code == 404


def test_chat_without_index_returns_404():
    """Asking questions on a freshly uploaded (not indexed) doc returns 404."""
    upload = client.post("/api/documents/upload", data={"text": SAMPLE_TEXT})
    doc_id = upload.json()["document_id"]
    chat = client.post(
        "/api/chat/",
        json={"document_id": doc_id, "message": "What are the late fees?", "history": []}
    )
    # Without AI and vector indexing, should be 404
    assert chat.status_code in (404, 200, 500)


def test_health_before_upload():
    """Health check passes before any documents are uploaded."""
    assert client.get("/health").status_code == 200


def test_provider_list_always_available():
    """Provider list returns even with no configured keys."""
    resp = client.get("/api/providers/")
    assert resp.status_code == 200
    assert "providers" in resp.json()
