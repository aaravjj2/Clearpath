"""Tests for the async retry decorator."""

import asyncio
import pytest
from utils.retry import async_retry


call_count = 0


@pytest.mark.asyncio
async def test_success_first_try():
    @async_retry(max_attempts=3, base_delay=0.01)
    async def always_succeeds():
        return "ok"

    result = await always_succeeds()
    assert result == "ok"


@pytest.mark.asyncio
async def test_retries_on_failure():
    attempts = []

    @async_retry(max_attempts=3, base_delay=0.01, jitter=False)
    async def fails_twice():
        attempts.append(1)
        if len(attempts) < 3:
            raise ValueError("transient error")
        return "recovered"

    result = await fails_twice()
    assert result == "recovered"
    assert len(attempts) == 3


@pytest.mark.asyncio
async def test_raises_after_max_attempts():
    @async_retry(max_attempts=2, base_delay=0.01, jitter=False)
    async def always_fails():
        raise RuntimeError("permanent failure")

    with pytest.raises(RuntimeError, match="permanent failure"):
        await always_fails()


@pytest.mark.asyncio
async def test_non_retryable_raises_immediately():
    attempts = []

    @async_retry(max_attempts=5, base_delay=0.01, retryable_exceptions=(ValueError,))
    async def raises_type_error():
        attempts.append(1)
        raise TypeError("not retryable")

    with pytest.raises(TypeError):
        await raises_type_error()
    assert len(attempts) == 1  # No retries for non-retryable exception


@pytest.mark.asyncio
async def test_delay_capped():
    """max_delay is respected (difficult to assert timing, just verify no hang)."""
    @async_retry(max_attempts=2, base_delay=0.01, max_delay=0.02, jitter=False)
    async def fail_once():
        raise OSError("timeout")

    with pytest.raises(OSError):
        await fail_once()
