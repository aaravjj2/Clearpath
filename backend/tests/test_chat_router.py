"""Tests for the chat router."""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_chat_empty_message_returns_400():
    resp = client.post("/api/chat/", json={"document_id": "any", "message": "", "history": []})
    assert resp.status_code == 400


def test_chat_whitespace_message_returns_400():
    resp = client.post("/api/chat/", json={"document_id": "any", "message": "  \t\n", "history": []})
    assert resp.status_code == 400


def test_chat_message_too_long_returns_400():
    resp = client.post(
        "/api/chat/",
        json={"document_id": "any", "message": "x" * 2001, "history": []}
    )
    assert resp.status_code == 400


def test_chat_unindexed_document_returns_404():
    resp = client.post(
        "/api/chat/",
        json={"document_id": "not-indexed", "message": "What are the payment terms?", "history": []}
    )
    assert resp.status_code == 404


def test_chat_missing_fields_returns_422():
    resp = client.post("/api/chat/", json={"message": "hello"})
    assert resp.status_code == 422
