"""Tests for Pydantic schema validation."""

import pytest
from pydantic import ValidationError
from models.schemas import (
    ChatRequest,
    Clause,
    ClauseType,
    RedFlag,
    RiskCategory,
    RiskScore,
)


class TestChatRequest:
    def test_valid(self):
        req = ChatRequest(document_id="doc1", message="What are the terms?", history=[])
        assert req.message == "What are the terms?"

    def test_blank_message_raises(self):
        with pytest.raises(ValidationError):
            ChatRequest(document_id="doc1", message="   ", history=[])

    def test_empty_message_raises(self):
        with pytest.raises(ValidationError):
            ChatRequest(document_id="doc1", message="", history=[])

    def test_empty_document_id_raises(self):
        with pytest.raises(ValidationError):
            ChatRequest(document_id="", message="hello", history=[])


class TestRedFlag:
    def test_severity_out_of_range(self):
        with pytest.raises(ValidationError):
            RedFlag(
                title="t", explanation="e", why_it_matters="w",
                what_to_ask="q", severity=4
            )

    def test_severity_zero_raises(self):
        with pytest.raises(ValidationError):
            RedFlag(
                title="t", explanation="e", why_it_matters="w",
                what_to_ask="q", severity=0
            )

    def test_valid_severity_3(self):
        rf = RedFlag(
            title="Serious issue",
            explanation="This is bad",
            why_it_matters="You lose rights",
            what_to_ask="Can you remove this?",
            severity=3,
        )
        assert rf.severity == 3


class TestRiskScore:
    def test_score_out_of_range(self):
        with pytest.raises(ValidationError):
            RiskScore(overall=101, categories=[])

    def test_category_score_out_of_range(self):
        with pytest.raises(ValidationError):
            RiskCategory(label="Risk", score=101, summary="")
