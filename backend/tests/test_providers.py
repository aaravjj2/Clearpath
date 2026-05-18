"""Tests for the provider registry and retry logic."""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from services.providers import (
    ProviderRegistry,
    ProviderName,
    ChatMessage,
    reset_registry,
    get_registry,
)


@pytest.fixture(autouse=True)
def clean_registry():
    reset_registry()
    yield
    reset_registry()


def test_get_registry_returns_singleton():
    r1 = get_registry()
    r2 = get_registry()
    assert r1 is r2


def test_reset_registry_creates_new():
    r1 = get_registry()
    reset_registry()
    r2 = get_registry()
    assert r1 is not r2


def test_add_keys_creates_provider():
    registry = ProviderRegistry()
    registry.add_keys(ProviderName.OPENAI, ["sk-test-key"])
    assert ProviderName.OPENAI in registry.providers
    assert registry.providers[ProviderName.OPENAI].available


def test_remove_keys_makes_unavailable():
    registry = ProviderRegistry()
    registry.add_keys(ProviderName.OPENAI, ["sk-test-key"])
    registry.remove_keys(ProviderName.OPENAI, ["sk-test-key"])
    assert not registry.providers[ProviderName.OPENAI].available


def test_get_available_providers_includes_ollama():
    registry = ProviderRegistry()
    providers = registry.get_available_providers()
    names = [p["name"] for p in providers]
    assert "ollama" in names


def test_is_retryable_timeout():
    registry = ProviderRegistry()
    assert registry._is_retryable(Exception("Connection timeout"))


def test_is_retryable_rate_limit():
    registry = ProviderRegistry()
    assert registry._is_retryable(Exception("rate limit exceeded"))


def test_is_not_retryable_auth_error():
    registry = ProviderRegistry()
    assert not registry._is_retryable(Exception("401 Unauthorized invalid api key"))


@pytest.mark.asyncio
async def test_complete_no_providers_raises():
    """Registry with no configured providers raises RuntimeError."""
    registry = ProviderRegistry()
    # Remove all providers
    registry.providers = {}
    registry.fallback_order = []
    with pytest.raises(RuntimeError, match="No AI providers"):
        await registry.complete([ChatMessage(role="user", content="Hello")])
