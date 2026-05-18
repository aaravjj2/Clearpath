"""Tests for vectorstore service."""

import pytest
from services.vectorstore import delete_document, index_document, query_document


def test_index_and_query():
    """Indexing clauses then querying should return relevant results."""
    doc_id = "test-vs-001"
    clauses = ["Payment of $1000 per month is due on the first.", "Termination requires 30 days notice."]
    ids = ["c1", "c2"]
    index_document(doc_id, clauses, ids)

    results = query_document(doc_id, "when do I pay rent", n_results=1)
    assert len(results) == 1

    delete_document(doc_id)


def test_query_nonexistent_returns_empty():
    """Querying a doc that was never indexed returns []."""
    results = query_document("never-indexed-doc", "payment terms", n_results=3)
    assert results == []


def test_index_length_mismatch_raises():
    """Mismatched clause/id lists should raise ValueError."""
    with pytest.raises(ValueError):
        index_document("bad-doc", ["clause one"], ["id1", "id2"])


def test_delete_nonexistent_returns_false():
    """Deleting a non-existent collection gracefully returns False."""
    result = delete_document("does-not-exist-12345")
    assert result is False


def test_query_capped_n_results():
    """n_results is capped to collection size."""
    doc_id = "test-vs-cap"
    index_document(doc_id, ["Only one clause here."], ["only"])
    results = query_document(doc_id, "clause", n_results=10)
    assert len(results) == 1
    delete_document(doc_id)
