"""Tests for per-document semaphore rate limiter."""

import asyncio
import pytest
from services.rate_limiter import DocumentSemaphorePool


@pytest.mark.asyncio
async def test_single_acquire_release():
    pool = DocumentSemaphorePool(max_concurrent=2)
    await pool.acquire("doc1")
    pool.release("doc1")


@pytest.mark.asyncio
async def test_max_concurrent_blocks():
    pool = DocumentSemaphorePool(max_concurrent=1)
    await pool.acquire("doc2")
    # Second acquire should block; use wait_for to detect
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(pool.acquire("doc2"), timeout=0.05)
    pool.release("doc2")


@pytest.mark.asyncio
async def test_cleanup_removes_semaphore():
    pool = DocumentSemaphorePool(max_concurrent=2)
    await pool.acquire("doc3")
    pool.release("doc3")
    pool.cleanup("doc3")
    assert "doc3" not in pool._semaphores


@pytest.mark.asyncio
async def test_different_docs_independent():
    pool = DocumentSemaphorePool(max_concurrent=1)
    await pool.acquire("docA")
    # Different doc should not be blocked
    await pool.acquire("docB")
    pool.release("docA")
    pool.release("docB")
