"""
OpenAI-compatible Chat Completions API.

Exposes /v1/chat/completions so CLI tools (GitHub Copilot CLI, shell aliases, etc.)
can use ClearPath as an AI backend. Works with any configured provider.
"""

import json
import time
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.ai import chat_completion
from services.providers import get_registry

router = APIRouter(tags=["completions"])


# ---------------------------------------------------------------------------
# Request / response schemas (OpenAI-compatible)
# ---------------------------------------------------------------------------

class CompletionMessage(BaseModel):
    role: str
    content: str


class CompletionRequest(BaseModel):
    model: Optional[str] = None
    messages: List[CompletionMessage]
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False
    provider: Optional[str] = None  # ClearPath extension: pick provider


class CompletionChoice(BaseModel):
    index: int = 0
    message: CompletionMessage
    finish_reason: str = "stop"


class CompletionUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class CompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[CompletionChoice]
    usage: CompletionUsage
    provider: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/v1/chat/completions")
async def create_chat_completion(req: CompletionRequest):
    """
    OpenAI-compatible chat completions endpoint.
    
    Supports all configured providers (Anthropic, OpenAI, Gemini, OpenRouter, Ollama).
    Specify `provider` field to force a specific provider, or leave blank for auto-fallback.
    
    Usage with curl:
        curl http://localhost:8000/v1/chat/completions \\
          -H "Content-Type: application/json" \\
          -d '{"messages": [{"role": "user", "content": "Explain arbitration clauses"}]}'
    
    Usage with GitHub Copilot CLI:
        Set OPENAI_API_BASE=http://localhost:8000/v1
    """
    try:
        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        result = await chat_completion(
            messages=messages,
            provider=req.provider,
            model=req.model,
            max_tokens=req.max_tokens or 1024,
            temperature=req.temperature or 0.7,
        )

        return CompletionResponse(
            id=result.id,
            created=result.created,
            model=result.model,
            choices=[CompletionChoice(
                message=CompletionMessage(role="assistant", content=result.content),
                finish_reason=result.finish_reason,
            )],
            usage=CompletionUsage(**result.usage),
            provider=result.provider,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/v1/models")
async def list_models():
    """List all available models across providers (OpenAI-compatible)."""
    registry = get_registry()
    providers = registry.get_available_providers()
    models = []
    for p in providers:
        for m in p["models"]:
            models.append({
                "id": m,
                "object": "model",
                "created": int(time.time()),
                "owned_by": p["name"],
                "provider": p["name"],
                "is_local": p["is_local"],
            })
    return {"object": "list", "data": models}
