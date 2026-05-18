"""Unit tests for backend services."""

import pytest

from services.parser import extract_text_from_pdf, segment_clauses
from services.risk_scorer import compute_fallback_risk_score
from models.schemas import Clause, ClauseType


def test_segment_clauses_empty_text():
    """Test segmentation with empty text."""
    result = segment_clauses("")
    assert result == []


def test_segment_clauses_single_short():
    """Test segmentation with text too short to split."""
    text = "This is a short clause."
    result = segment_clauses(text)
    assert len(result) == 1


def test_segment_clauses_numbered():
    """Test segmentation with numbered sections."""
    text = """1. Payment Terms
    The tenant shall pay rent on the first of each month.
    
    2. Termination Rights
    Either party may terminate with 30 days notice.
    
    3. Liability Waiver
    Landlord is not liable for any damage."""
    
    result = segment_clauses(text)
    assert len(result) >= 1


def test_segment_clauses_paragraph_breaks():
    """Test segmentation on paragraph breaks."""
    text = "A" * 100 + "\n\n" + "B" * 100 + "\n\n" + "C" * 100
    result = segment_clauses(text)
    assert len(result) >= 2


def test_compute_fallback_risk_score_empty():
    """Test risk scoring with no clauses."""
    score = compute_fallback_risk_score([])
    assert score.overall == 0
    assert len(score.categories) == 4
    assert all(c.score == 0 for c in score.categories)


def test_compute_fallback_risk_score_with_flags():
    """Test risk scoring with red-flagged clauses."""
    from models.schemas import RedFlag
    
    clause = Clause(
        id="test1",
        index=0,
        original_text="Landlord may enter without notice",
        simplified_text="The landlord can come in anytime",
        clause_type=ClauseType.general,
        key_terms=["entry", "notice"],
        red_flag=RedFlag(
            title="No notice entry",
            explanation="Landlord can enter without warning",
            why_it_matters="Violates privacy",
            what_to_ask="Can you require 24-hour notice?",
            severity=3
        )
    )
    
    score = compute_fallback_risk_score([clause])
    assert score.overall > 0
    assert any(c.score > 0 for c in score.categories)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
