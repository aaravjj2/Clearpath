"""
Shared pytest fixtures for ClearPath backend tests.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from services.providers import reset_registry


@pytest.fixture(scope="function", autouse=True)
def reset_provider_state():
    """Reset provider registry before/after each test for clean state."""
    reset_registry()
    yield
    reset_registry()


@pytest.fixture(scope="session")
def test_client():
    """Shared TestClient instance for all tests."""
    return TestClient(app)


@pytest.fixture
def sample_contract_text():
    return (
        "1. Payment Terms. Tenant shall pay $1,500 per month on the 1st of each month.\n\n"
        "2. Late Fees. A fee of $150 applies to payments received after the 5th.\n\n"
        "3. Termination. Either party may terminate with 30 days written notice.\n\n"
        "4. Non-Compete. Tenant agrees not to operate a competing business within 5 miles.\n\n"
        "5. Limitation of Liability. Landlord not liable for any indirect damages whatsoever."
    )


@pytest.fixture
def uploaded_doc_id(test_client, sample_contract_text):
    """Upload a sample document and return its ID."""
    resp = test_client.post(
        "/api/documents/upload",
        data={"text": sample_contract_text},
    )
    assert resp.status_code == 200
    return resp.json()["document_id"]
