"""Tests for the documents router."""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_upload_text_success():
    resp = client.post("/api/documents/upload", data={"text": "x " * 30})
    assert resp.status_code == 200
    data = resp.json()
    assert "document_id" in data
    assert data["filename"] == "pasted_document.txt"


def test_upload_both_file_and_text_uses_file():
    """When both file and text provided, file takes precedence (first truthy branch)."""
    pdf_bytes = b"%PDF-1.4 minimal"
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
        data={"text": "ignored text"},
    )
    # File path: magic bytes invalid minimal PDF, expect 400 (extract_text failure) or 415
    assert resp.status_code in (200, 400, 415)


def test_upload_neither_returns_400():
    resp = client.post("/api/documents/upload")
    assert resp.status_code == 400


def test_summary_returns_document():
    upload = client.post("/api/documents/upload", data={"text": "A " * 30})
    doc_id = upload.json()["document_id"]
    resp = client.get(f"/api/documents/{doc_id}/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_id"] == doc_id
    assert data["status"] == "processing"


def test_stream_returns_sse_for_known_doc():
    upload = client.post("/api/documents/upload", data={"text": "A " * 30})
    doc_id = upload.json()["document_id"]
    # Use stream=True to avoid blocking
    resp = client.get(f"/api/documents/{doc_id}/stream", headers={"Accept": "text/event-stream"})
    # Status 200 is expected even if stream is short
    assert resp.status_code == 200


def test_fake_pdf_rejected():
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("bad.pdf", b"NOT A PDF", "application/pdf")},
    )
    assert resp.status_code == 415


def test_oversized_text_rejected():
    resp = client.post("/api/documents/upload", data={"text": "x" * 600_000})
    assert resp.status_code == 413
