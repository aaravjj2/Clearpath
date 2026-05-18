"""
Multi-provider AI abstraction layer for ClearPath.

Supports:
  - Anthropic Claude (cloud)
  - OpenAI GPT (cloud)
  - Google Gemini (cloud)
  - OpenRouter (cloud aggregator)
  - Ollama (local/offline)

Features:
  - BYOK (Bring Your Own Key) — multiple keys per provider, round-robin rotation
  - Automatic fallback chain across providers
  - Unified chat-completion interface (OpenAI-compatible)
"""

import asyncio
import itertools
import json
import logging
import os
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, AsyncIterator, Dict, List, Optional

import httpx

logger = logging.getLogger("clearpath.providers")


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

class ProviderName(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GEMINI = "gemini"
    OPENROUTER = "openrouter"
    OLLAMA = "ollama"


@dataclass
class ChatMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass
class ChatCompletion:
    """OpenAI-compatible chat completion response."""
    id: str
    model: str
    provider: str
    content: str
    finish_reason: str = "stop"
    usage: Dict[str, int] = field(default_factory=dict)
    created: int = field(default_factory=lambda: int(time.time()))

    def to_openai_dict(self) -> dict:
        return {
            "id": self.id,
            "object": "chat.completion",
            "created": self.created,
            "model": self.model,
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": self.content},
                "finish_reason": self.finish_reason,
            }],
            "usage": self.usage,
            "provider": self.provider,
        }


@dataclass
class StreamChunk:
    """OpenAI-compatible streaming chunk."""
    id: str
    model: str
    delta_content: str
    finish_reason: Optional[str] = None

    def to_openai_dict(self) -> dict:
        delta = {}
        if self.delta_content:
            delta["content"] = self.delta_content
        if self.finish_reason:
            delta["finish_reason"] = self.finish_reason
        return {
            "id": self.id,
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": self.model,
            "choices": [{
                "index": 0,
                "delta": delta,
                "finish_reason": self.finish_reason,
            }],
        }


# ---------------------------------------------------------------------------
# Base provider
# ---------------------------------------------------------------------------

class BaseProvider:
    name: ProviderName
    _keys: List[str]
    _key_cycle: itertools.cycle

    def __init__(self, keys: List[str]):
        self._keys = [k for k in keys if k]
        self._key_cycle = itertools.cycle(self._keys) if self._keys else itertools.cycle([""])

    @property
    def available(self) -> bool:
        return len(self._keys) > 0

    def _next_key(self) -> str:
        return next(self._key_cycle)

    async def complete(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        stream: bool = False,
    ) -> ChatCompletion:
        raise NotImplementedError

    async def stream_complete(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> AsyncIterator[StreamChunk]:
        raise NotImplementedError
        yield  # pragma: no cover

    def list_models(self) -> List[str]:
        return []


# ---------------------------------------------------------------------------
# Anthropic provider
# ---------------------------------------------------------------------------

class AnthropicProvider(BaseProvider):
    name = ProviderName.ANTHROPIC
    DEFAULT_MODEL = "claude-sonnet-4-20250514"

    def __init__(self, keys: List[str]):
        super().__init__(keys)

    async def complete(self, messages, model=None, max_tokens=1024, temperature=0.7, stream=False):
        import anthropic
        key = self._next_key()
        client = anthropic.Anthropic(api_key=key)
        model = model or self.DEFAULT_MODEL

        # Separate system messages
        system_parts = [m.content for m in messages if m.role == "system"]
        chat_msgs = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
        system_text = "\n".join(system_parts) if system_parts else None

        def _call():
            kwargs = dict(
                model=model,
                max_tokens=max_tokens,
                messages=chat_msgs,
            )
            if system_text:
                kwargs["system"] = system_text
            return client.messages.create(**kwargs)

        resp = await asyncio.to_thread(_call)
        return ChatCompletion(
            id=resp.id,
            model=resp.model,
            provider=self.name.value,
            content=resp.content[0].text,
            usage={"prompt_tokens": resp.usage.input_tokens, "completion_tokens": resp.usage.output_tokens,
                    "total_tokens": resp.usage.input_tokens + resp.usage.output_tokens},
        )

    def list_models(self):
        return ["claude-sonnet-4-20250514", "claude-haiku-4-20250414", "claude-opus-4-20250514"]


# ---------------------------------------------------------------------------
# OpenAI provider
# ---------------------------------------------------------------------------

class OpenAIProvider(BaseProvider):
    name = ProviderName.OPENAI
    DEFAULT_MODEL = "gpt-4o"

    async def complete(self, messages, model=None, max_tokens=1024, temperature=0.7, stream=False):
        key = self._next_key()
        model = model or self.DEFAULT_MODEL
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        choice = data["choices"][0]
        return ChatCompletion(
            id=data["id"],
            model=data["model"],
            provider=self.name.value,
            content=choice["message"]["content"],
            finish_reason=choice.get("finish_reason", "stop"),
            usage=data.get("usage", {}),
        )

    def list_models(self):
        return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o3-mini"]


# ---------------------------------------------------------------------------
# Google Gemini provider
# ---------------------------------------------------------------------------

class GeminiProvider(BaseProvider):
    name = ProviderName.GEMINI
    DEFAULT_MODEL = "gemini-2.5-flash"

    async def complete(self, messages, model=None, max_tokens=1024, temperature=0.7, stream=False):
        key = self._next_key()
        model = model or self.DEFAULT_MODEL
        # Use the Gemini REST API (generateContent)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

        # Convert to Gemini format
        contents = []
        system_instruction = None
        for m in messages:
            if m.role == "system":
                system_instruction = m.content
            else:
                role = "user" if m.role == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m.content}]})

        payload: dict = {
            "contents": contents,
            "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        usage_meta = data.get("usageMetadata", {})
        return ChatCompletion(
            id=f"gemini-{int(time.time())}",
            model=model,
            provider=self.name.value,
            content=text,
            usage={
                "prompt_tokens": usage_meta.get("promptTokenCount", 0),
                "completion_tokens": usage_meta.get("candidatesTokenCount", 0),
                "total_tokens": usage_meta.get("totalTokenCount", 0),
            },
        )

    def list_models(self):
        return ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]


# ---------------------------------------------------------------------------
# OpenRouter provider
# ---------------------------------------------------------------------------

class OpenRouterProvider(BaseProvider):
    name = ProviderName.OPENROUTER
    DEFAULT_MODEL = "anthropic/claude-sonnet-4-20250514"

    async def complete(self, messages, model=None, max_tokens=1024, temperature=0.7, stream=False):
        key = self._next_key()
        model = model or self.DEFAULT_MODEL
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://clearpath.app",
            "X-Title": "ClearPath",
        }
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        choice = data["choices"][0]
        return ChatCompletion(
            id=data.get("id", f"or-{int(time.time())}"),
            model=data.get("model", model),
            provider=self.name.value,
            content=choice["message"]["content"],
            finish_reason=choice.get("finish_reason", "stop"),
            usage=data.get("usage", {}),
        )

    def list_models(self):
        return [
            "anthropic/claude-sonnet-4-20250514",
            "openai/gpt-4o",
            "google/gemini-2.5-flash",
            "meta-llama/llama-4-maverick",
            "deepseek/deepseek-r1",
        ]


# ---------------------------------------------------------------------------
# Ollama (local/offline) provider
# ---------------------------------------------------------------------------

class OllamaProvider(BaseProvider):
    name = ProviderName.OLLAMA
    DEFAULT_MODEL = "llama3.2"

    def __init__(self, base_url: str = "http://localhost:11434"):
        super().__init__(["local"])  # No API key needed
        self.base_url = base_url.rstrip("/")
        self._is_available: Optional[bool] = None

    @property
    def available(self) -> bool:
        return self._is_available if self._is_available is not None else True

    async def check_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                self._is_available = resp.status_code == 200
        except Exception:
            self._is_available = False
        return self._is_available

    async def complete(self, messages, model=None, max_tokens=1024, temperature=0.7, stream=False):
        model = model or self.DEFAULT_MODEL
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": {"num_predict": max_tokens, "temperature": temperature},
        }
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()

        content = data.get("message", {}).get("content", "")
        return ChatCompletion(
            id=f"ollama-{int(time.time())}",
            model=model,
            provider=self.name.value,
            content=content,
            usage={
                "prompt_tokens": data.get("prompt_eval_count", 0),
                "completion_tokens": data.get("eval_count", 0),
                "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            },
        )

    async def stream_complete(self, messages, model=None, max_tokens=1024, temperature=0.7):
        model = model or self.DEFAULT_MODEL
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
            "options": {"num_predict": max_tokens, "temperature": temperature},
        }
        chunk_id = f"ollama-{int(time.time())}"
        async with httpx.AsyncClient(timeout=300) as client:
            async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as resp:
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    done = data.get("done", False)
                    yield StreamChunk(
                        id=chunk_id,
                        model=model,
                        delta_content=content,
                        finish_reason="stop" if done else None,
                    )

    async def list_local_models(self) -> List[str]:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    return [m["name"] for m in data.get("models", [])]
        except Exception:
            pass
        return []

    def list_models(self):
        return ["llama3.2", "llama3.1", "mistral", "codellama", "phi3", "qwen2.5"]


# ---------------------------------------------------------------------------
# Provider Registry — manages all providers + fallback
# ---------------------------------------------------------------------------

class ProviderRegistry:
    """
    Central registry for all AI providers.
    Loads config from environment and supports runtime BYOK updates.
    """

    def __init__(self):
        self.providers: Dict[ProviderName, BaseProvider] = {}
        self.fallback_order: List[ProviderName] = []
        self._load_from_env()

    def _load_from_env(self):
        # Anthropic
        anthropic_keys = self._parse_keys("ANTHROPIC_API_KEY", "ANTHROPIC_API_KEYS")
        if anthropic_keys:
            self.providers[ProviderName.ANTHROPIC] = AnthropicProvider(anthropic_keys)

        # OpenAI
        openai_keys = self._parse_keys("OPENAI_API_KEY", "OPENAI_API_KEYS")
        if openai_keys:
            self.providers[ProviderName.OPENAI] = OpenAIProvider(openai_keys)

        # Gemini
        gemini_keys = self._parse_keys("GEMINI_API_KEY", "GEMINI_API_KEYS")
        if gemini_keys:
            self.providers[ProviderName.GEMINI] = GeminiProvider(gemini_keys)

        # OpenRouter
        openrouter_keys = self._parse_keys("OPENROUTER_API_KEY", "OPENROUTER_API_KEYS")
        if openrouter_keys:
            self.providers[ProviderName.OPENROUTER] = OpenRouterProvider(openrouter_keys)

        # Ollama (always register, check availability later)
        ollama_url = os.getenv("OLLAMA_URL", os.getenv("LOCAL_AI_URL", "http://localhost:11434"))
        self.providers[ProviderName.OLLAMA] = OllamaProvider(ollama_url)

        # Preferred order
        preferred = os.getenv("PREFERRED_AI_PROVIDERS", "anthropic,openai,gemini,openrouter,ollama")
        for name in preferred.split(","):
            name = name.strip().lower()
            try:
                pn = ProviderName(name)
                if pn in self.providers:
                    self.fallback_order.append(pn)
            except ValueError:
                continue

        # Ensure all providers are in fallback even if not in preferred
        for pn in self.providers:
            if pn not in self.fallback_order:
                self.fallback_order.append(pn)

    @staticmethod
    def _parse_keys(*env_names: str) -> List[str]:
        keys = []
        for env in env_names:
            val = os.getenv(env, "")
            if val:
                keys.extend([k.strip() for k in val.split(",") if k.strip()])
        return keys

    def add_keys(self, provider: ProviderName, keys: List[str]):
        """Add BYOK keys at runtime."""
        if provider == ProviderName.OLLAMA:
            return  # No keys needed
        existing = self.providers.get(provider)
        if existing:
            all_keys = list(set(existing._keys + keys))
            existing._keys = all_keys
            existing._key_cycle = itertools.cycle(all_keys)
        else:
            cls_map = {
                ProviderName.ANTHROPIC: AnthropicProvider,
                ProviderName.OPENAI: OpenAIProvider,
                ProviderName.GEMINI: GeminiProvider,
                ProviderName.OPENROUTER: OpenRouterProvider,
            }
            cls = cls_map.get(provider)
            if cls:
                self.providers[provider] = cls(keys)
                if provider not in self.fallback_order:
                    self.fallback_order.append(provider)

    def remove_keys(self, provider: ProviderName, keys: List[str]):
        """Remove specific BYOK keys at runtime."""
        existing = self.providers.get(provider)
        if existing:
            existing._keys = [k for k in existing._keys if k not in keys]
            existing._key_cycle = itertools.cycle(existing._keys) if existing._keys else itertools.cycle([""])

    def get_provider(self, name: ProviderName) -> Optional[BaseProvider]:
        return self.providers.get(name)

    def get_available_providers(self) -> List[Dict[str, Any]]:
        result = []
        for pn in self.fallback_order:
            p = self.providers.get(pn)
            if p:
                result.append({
                    "name": pn.value,
                    "available": p.available,
                    "models": p.list_models(),
                    "key_count": len(p._keys) if pn != ProviderName.OLLAMA else 0,
                    "is_local": pn == ProviderName.OLLAMA,
                })
        return result

    async def complete(
        self,
        messages: List[ChatMessage],
        provider: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ChatCompletion:
        """
        Run a chat completion with automatic fallback.
        If a specific provider is requested, try only that one.
        Otherwise, try providers in fallback order.
        """
        errors = []

        if provider:
            try:
                pn = ProviderName(provider)
                p = self.providers.get(pn)
                if p and p.available:
                    return await p.complete(messages, model=model, max_tokens=max_tokens, temperature=temperature)
            except (ValueError, Exception) as e:
                errors.append(f"{provider}: {e}")

        # Fallback chain
        for pn in self.fallback_order:
            p = self.providers.get(pn)
            if not p or not p.available:
                continue
            # Skip ollama for large requests unless explicitly requested
            if pn == ProviderName.OLLAMA and not provider:
                is_avail = await p.check_available()
                if not is_avail:
                    continue
            try:
                result = await p.complete(messages, model=model, max_tokens=max_tokens, temperature=temperature)
                logger.info(f"Completed via {pn.value} ({result.model})")
                return result
            except Exception as e:
                errors.append(f"{pn.value}: {e}")
                logger.warning(f"Provider {pn.value} failed: {e}")
                continue

        raise RuntimeError(f"All providers failed: {'; '.join(errors)}")


# ---------------------------------------------------------------------------
# Global singleton
# ---------------------------------------------------------------------------

_registry: Optional[ProviderRegistry] = None


def get_registry() -> ProviderRegistry:
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
    return _registry


def reset_registry():
    """Reset for testing."""
    global _registry
    _registry = None
