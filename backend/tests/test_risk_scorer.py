"""Tests for the fallback risk scorer."""

import pytest
from models.schemas import Clause, ClauseType, RedFlag
from services.risk_scorer import compute_fallback_risk_score, _category_bonus


def _make_clause(clause_type: str, severity: int | None = None) -> Clause:
    rf = None
    if severity is not None:
        rf = RedFlag(
            title="Test flag",
            explanation="Test explanation",
            why_it_matters="Matters for test",
            what_to_ask="Ask about this",
            severity=severity,
        )
    return Clause(
        id=f"test-{clause_type}",
        index=0,
        original_text="Test clause text " * 5,
        simplified_text="Simplified text.",
        clause_type=ClauseType(clause_type),
        key_terms=["test"],
        red_flag=rf,
    )


def test_empty_clauses():
    score = compute_fallback_risk_score([])
    assert score.overall == 0
    assert all(c.score == 0 for c in score.categories)


def test_single_high_severity():
    clause = _make_clause("payment", severity=3)
    score = compute_fallback_risk_score([clause])
    assert score.overall > 0
    payment_cat = next(c for c in score.categories if c.label == "Payment Risk")
    assert payment_cat.score > 0


def test_no_red_flags():
    clauses = [_make_clause("general"), _make_clause("termination")]
    score = compute_fallback_risk_score(clauses)
    assert 0 <= score.overall <= 100


def test_overall_is_average_of_categories():
    clauses = [_make_clause("liability", severity=2)]
    score = compute_fallback_risk_score([clauses[0]])
    expected = round(sum(c.score for c in score.categories) / 4)
    assert score.overall == expected


def test_category_bonus_caps_at_45():
    clauses = [_make_clause("payment", severity=3)] * 10
    bonus = _category_bonus(clauses, {"payment"})
    assert bonus <= 45


def test_scores_bounded():
    """All scores should be in [0, 100]."""
    clauses = [_make_clause("liability", severity=3)] * 20
    score = compute_fallback_risk_score(clauses)
    assert 0 <= score.overall <= 100
    for cat in score.categories:
        assert 0 <= cat.score <= 100
