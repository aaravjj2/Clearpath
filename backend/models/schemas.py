"""
Pydantic schemas for ClearPath API request/response models.
"""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class ClauseType(str, Enum):
    payment = "payment"
    termination = "termination"
    liability = "liability"
    privacy = "privacy"
    non_compete = "non_compete"
    intellectual_property = "intellectual_property"
    dispute_resolution = "dispute_resolution"
    renewal = "renewal"
    general = "general"


class RedFlag(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    explanation: str = Field(..., min_length=1)
    why_it_matters: str = Field(..., min_length=1)
    what_to_ask: str = Field(..., min_length=1)
    severity: int = Field(..., ge=1, le=3)


class Clause(BaseModel):
    id: str
    index: int = Field(..., ge=0)
    original_text: str
    simplified_text: str
    clause_type: ClauseType
    key_terms: List[str] = Field(default_factory=list)
    red_flag: Optional[RedFlag] = None


class RiskCategory(BaseModel):
    label: str
    score: int = Field(..., ge=0, le=100)
    summary: str


class RiskScore(BaseModel):
    overall: int = Field(..., ge=0, le=100)
    categories: List[RiskCategory]


class DocumentAnalysis(BaseModel):
    document_id: str
    filename: str
    total_clauses: int = Field(default=0, ge=0)
    clauses: List[Clause] = Field(default_factory=list)
    risk_score: Optional[RiskScore] = None
    red_flags: List[Clause] = Field(default_factory=list)
    status: str = "processing"


class ChatRequest(BaseModel):
    document_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    history: List[dict] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message must not be blank")
        return v


class ChatResponse(BaseModel):
    answer: str
    cited_clause_id: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response body."""
    detail: str
    code: Optional[str] = None
