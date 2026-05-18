"""
Provider management API — BYOK (Bring Your Own Key) and provider status.

Endpoints:
  GET  /api/providers         — list all providers with status
  POST /api/providers/keys    — add BYOK keys
  DELETE /api/providers/keys  — remove BYOK keys
  GET  /api/providers/health  — check provider health
  GET  /api/providers/ollama/models — list local Ollama models
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.providers import ProviderName, get_registry

router = APIRouter(prefix="/api/providers", tags=["providers"])


class AddKeysRequest(BaseModel):
    provider: str
    keys: List[str]


class RemoveKeysRequest(BaseModel):
    provider: str
    keys: List[str]


class SetPreferredRequest(BaseModel):
    order: List[str]


@router.get("/")
async def list_providers():
    """List all providers with their availability status, models, and key counts."""
    registry = get_registry()
    return {"providers": registry.get_available_providers()}


@router.post("/keys")
async def add_keys(req: AddKeysRequest):
    """
    Add API keys for a provider (BYOK).
    Keys are stored in-memory and used with round-robin rotation.
    """
    try:
        provider = ProviderName(req.provider.lower())
    except ValueError:
        raise HTTPException(400, f"Unknown provider: {req.provider}")

    if not req.keys or not any(k.strip() for k in req.keys):
        raise HTTPException(400, "At least one non-empty key required")

    registry = get_registry()
    registry.add_keys(provider, [k.strip() for k in req.keys if k.strip()])
    p = registry.providers.get(provider)
    return {
        "status": "ok",
        "provider": req.provider,
        "key_count": len(p._keys) if p else 0,
    }


@router.delete("/keys")
async def remove_keys(req: RemoveKeysRequest):
    """Remove specific API keys for a provider."""
    try:
        provider = ProviderName(req.provider.lower())
    except ValueError:
        raise HTTPException(400, f"Unknown provider: {req.provider}")

    registry = get_registry()
    registry.remove_keys(provider, req.keys)
    p = registry.providers.get(provider)
    return {
        "status": "ok",
        "provider": req.provider,
        "key_count": len(p._keys) if p else 0,
    }


@router.get("/health")
async def check_health():
    """Check health of all providers."""
    registry = get_registry()
    results = {}

    for pn, p in registry.providers.items():
        if pn == ProviderName.OLLAMA:
            is_available = await p.check_available()
            results[pn.value] = {
                "status": "online" if is_available else "offline",
                "type": "local",
                "url": p.base_url,
            }
        else:
            results[pn.value] = {
                "status": "configured" if p.available else "no_keys",
                "type": "cloud",
                "key_count": len(p._keys),
            }

    return {"providers": results}


@router.get("/ollama/models")
async def list_ollama_models():
    """List models available in the local Ollama instance."""
    registry = get_registry()
    ollama = registry.providers.get(ProviderName.OLLAMA)
    if not ollama:
        raise HTTPException(404, "Ollama provider not configured")

    models = await ollama.list_local_models()
    return {"models": models, "available": len(models) > 0}


@router.post("/preferred")
async def set_preferred_order(req: SetPreferredRequest):
    """Set the preferred provider fallback order."""
    registry = get_registry()
    new_order = []
    for name in req.order:
        try:
            pn = ProviderName(name.lower())
            if pn in registry.providers:
                new_order.append(pn)
        except ValueError:
            continue

    # Add any remaining providers not in the list
    for pn in registry.providers:
        if pn not in new_order:
            new_order.append(pn)

    registry.fallback_order = new_order
    return {"status": "ok", "order": [p.value for p in new_order]}
