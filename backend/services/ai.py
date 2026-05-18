"""
AI service for ClearPath — uses multi-provider abstraction.

All AI calls go through the ProviderRegistry for automatic fallback,
BYOK support, and offline (Ollama) capability.
"""

import asyncio
import json
import os
import uuid
from typing import List, Optional

from models.schemas import Clause, ClauseType, RedFlag, RiskCategory, RiskScore
from services.providers import ChatMessage, get_registry

CLAUSE_SYSTEM = """You are a legal document analyzer. Your job is to analyze individual clauses from legal documents and return structured JSON.

You must ALWAYS return valid JSON with exactly this structure — no preamble, no markdown fences:
{
  "simplified_text": "Plain English explanation at 8th grade reading level (2-4 sentences)",
  "clause_type": "one of: payment|termination|liability|privacy|non_compete|intellectual_property|dispute_resolution|renewal|general",
  "key_terms": ["list", "of", "3-5", "important", "terms"],
  "red_flag": null OR {
    "title": "Short title of the issue",
    "explanation": "What this clause actually does",
    "why_it_matters": "Concrete impact on the person signing",
    "what_to_ask": "Specific question to raise with the other party",
    "severity": 1|2|3
  }
}

Red flag severity: 1=minor (worth noting), 2=moderate (negotiate this), 3=serious (do not sign without legal advice)

Flag a clause as red flag if it:
- Heavily favors one party with no reciprocity
- Waives significant rights (arbitration, class action, right to cure)
- Contains automatic renewal with penalty for cancellation
- Allows unilateral modification without notice
- Has unusual or excessive penalty clauses
- Contains illegal terms in most jurisdictions"""

RISK_SYSTEM = """You are a legal document risk assessor. Given a list of clause analyses, compute an overall document risk score.

Return ONLY valid JSON:
{
  "overall": <integer 0-100, where 0=very fair, 100=extremely predatory>,
  "categories": [
    {"label": "Payment Risk", "score": <0-100>, "summary": "1-2 sentence summary"},
    {"label": "Privacy Risk", "score": <0-100>, "summary": "1-2 sentence summary"},
    {"label": "Exit Risk", "score": <0-100>, "summary": "1-2 sentence summary"},
    {"label": "Liability Risk", "score": <0-100>, "summary": "1-2 sentence summary"}
  ]
}"""


def _extract_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


async def analyze_clause(
    clause_text: str,
    index: int,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> Clause:
    """Analyze a single clause with the configured AI provider."""
    registry = get_registry()
    messages = [
        ChatMessage(role="system", content=CLAUSE_SYSTEM),
        ChatMessage(role="user", content=f"Analyze this clause:\n\n{clause_text}"),
    ]

    completion = await registry.complete(
        messages=messages,
        provider=provider,
        model=model,
        max_tokens=800,
        temperature=0.3,
    )
    data = _extract_json(completion.content)

    red_flag = None
    if data.get("red_flag"):
        rf = data["red_flag"]
        red_flag = RedFlag(
            title=rf["title"],
            explanation=rf["explanation"],
            why_it_matters=rf["why_it_matters"],
            what_to_ask=rf["what_to_ask"],
            severity=rf["severity"]
        )

    return Clause(
        id=str(uuid.uuid4()),
        index=index,
        original_text=clause_text,
        simplified_text=data["simplified_text"],
        clause_type=ClauseType(data["clause_type"]),
        key_terms=data.get("key_terms", []),
        red_flag=red_flag
    )


async def compute_risk_score(
    clauses: List[Clause],
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> RiskScore:
    """Compute overall document risk from all clauses."""
    registry = get_registry()
    clause_summary: List[str] = []
    for c in clauses:
        entry = (
            f"Type: {c.clause_type.value}, Red Flag: "
            f"{c.red_flag.title if c.red_flag else 'None'} "
            f"(severity {c.red_flag.severity if c.red_flag else 0})"
        )
        clause_summary.append(entry)

    messages = [
        ChatMessage(role="system", content=RISK_SYSTEM),
        ChatMessage(role="user", content="Document clause analysis:\n" + "\n".join(clause_summary)),
    ]

    completion = await registry.complete(
        messages=messages,
        provider=provider,
        model=model,
        max_tokens=600,
        temperature=0.3,
    )
    data = _extract_json(completion.content)
    return RiskScore(overall=data["overall"], categories=[RiskCategory(**cat) for cat in data["categories"]])


async def answer_question(
    question: str,
    context_chunks: List[str],
    history: list,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> str:
    """Answer a user question grounded in the document."""
    registry = get_registry()
    system = f"""You are a legal document assistant. Answer questions about the document the user has uploaded.

RULES:
- Answer ONLY from the provided document context. Never use outside legal knowledge.
- If the answer is not in the document, say "This document doesn't address that specifically."
- Be concise and use plain language.
- End your answer by citing the relevant clause: "📌 Source: [brief clause description]"

DOCUMENT CONTEXT:
{chr(10).join(context_chunks)}"""

    messages = [ChatMessage(role="system", content=system)]
    for h in history:
        messages.append(ChatMessage(role=h["role"], content=h["content"]))
    messages.append(ChatMessage(role="user", content=question))

    completion = await registry.complete(
        messages=messages,
        provider=provider,
        model=model,
        max_tokens=500,
        temperature=0.5,
    )
    return completion.content


async def chat_completion(
    messages: List[dict],
    provider: Optional[str] = None,
    model: Optional[str] = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
):
    """
    Generic chat completion — OpenAI-compatible interface.
    Used for CLI chat completions and the /v1/chat/completions endpoint.
    """
    registry = get_registry()
    chat_msgs = [ChatMessage(role=m["role"], content=m["content"]) for m in messages]
    return await registry.complete(
        messages=chat_msgs,
        provider=provider,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )
