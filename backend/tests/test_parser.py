"""Comprehensive tests for the document parser service."""

import pytest
from services.parser import extract_text_from_pdf, segment_clauses, _split_long


def test_segment_empty():
    assert segment_clauses("") == []
    assert segment_clauses("   \n\n  ") == []


def test_segment_single_short():
    result = segment_clauses("Short text.")
    assert result == []  # below min clause length


def test_segment_single_long():
    text = "x " * 30  # 60 chars — above MIN_CLAUSE_LEN
    result = segment_clauses(text)
    assert len(result) == 1


def test_segment_numbered_sections():
    text = (
        "1. Payment Terms\n" + "Pay $1000 monthly. " * 6 + "\n\n"
        "2. Termination Rights\n" + "Either party may exit. " * 6 + "\n\n"
        "3. Non-Compete\n" + "No competing for 2 years. " * 6
    )
    result = segment_clauses(text)
    assert len(result) >= 3


def test_segment_paragraph_fallback():
    text = ("First paragraph. " * 15) + "\n\n" + ("Second paragraph. " * 15)
    result = segment_clauses(text)
    assert len(result) >= 2


def test_split_long_under_limit():
    chunk = "A" * 2999
    assert _split_long(chunk) == [chunk]


def test_split_long_over_limit():
    # Create a long string with sentence boundaries
    chunk = ("This is a sentence. " * 200)
    parts = _split_long(chunk)
    assert all(len(p) <= 3000 for p in parts)
    assert len(parts) >= 2


def test_segment_max_clause_length():
    """Verify no output chunk exceeds MAX_CLAUSE_LEN."""
    from services.parser import _MAX_CLAUSE_LEN
    text = ("Long clause text. " * 300)
    result = segment_clauses(text)
    assert all(len(c) <= _MAX_CLAUSE_LEN for c in result)
