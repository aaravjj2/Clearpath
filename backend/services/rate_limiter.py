"""
Token-based rate limiting helper (per-document).

Limits how many concurrent clause analysis streams can run per document
to prevent resource exhaustion in case of parallel re-analysis requests.
"""

import asyncio
import logging

logger = logging.getLogger("clearpath.rate_limiter")


class DocumentSemaphorePool:
    """Per-document asyncio semaphore pool with max-concurrency limiting."""

    def __init__(self, max_concurrent: int = 3) -> None:
        self._max = max_concurrent
        self._semaphores: dict[str, asyncio.Semaphore] = {}
        self._lock = asyncio.Lock()

    async def _get_semaphore(self, document_id: str) -> asyncio.Semaphore:
        async with self._lock:
            if document_id not in self._semaphores:
                self._semaphores[document_id] = asyncio.Semaphore(self._max)
            return self._semaphores[document_id]

    async def acquire(self, document_id: str) -> asyncio.Semaphore:
        sem = await self._get_semaphore(document_id)
        await sem.acquire()
        return sem

    def release(self, document_id: str) -> None:
        sem = self._semaphores.get(document_id)
        if sem:
            sem.release()

    def cleanup(self, document_id: str) -> None:
        """Remove semaphore for a deleted document."""
        self._semaphores.pop(document_id, None)


_pool = DocumentSemaphorePool()


def get_semaphore_pool() -> DocumentSemaphorePool:
    return _pool
