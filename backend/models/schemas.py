from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


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
    title: str
    explanation: str
    why_it_matters: str
    what_to_ask: str
    severity: int  # 0-3


class Clause(BaseModel):
    id: str
    index: int
    original_text: str
    simplified_text: str
    clause_type: ClauseType
    key_terms: List[str]
    red_flag: Optional[RedFlag] = None


class RiskCategory(BaseModel):
    label: str
    score: int
    summary: str


class RiskScore(BaseModel):
    overall: int
    categories: List[RiskCategory]


class DocumentAnalysis(BaseModel):
    document_id: str
    filename: str
    total_clauses: int
    clauses: List[Clause]
    risk_score: Optional[RiskScore] = None
    red_flags: List[Clause] = Field(default_factory=list)
    status: str = "processing"


class ChatRequest(BaseModel):
    document_id: str
    message: str
    history: List[dict] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    cited_clause_id: Optional[str] = None
