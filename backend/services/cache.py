"""
Simple in-memory LRU cache for ClearPath.

Used to cache clause analysis results so re-analysis of the same document
doesn't hit the AI provider again.
"""

import logging
from collections import OrderedDict
from typing import Any, Optional

logger = logging.getLogger("clearpath.cache")


class LRUCache:
    """Thread-safe (GIL-protected) LRU cache with a max-size cap."""

    def __init__(self, max_size: int = 128) -> None:
        self._cache: OrderedDict[str, Any] = OrderedDict()
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            self._cache.move_to_end(key)
            self._hits += 1
            return self._cache[key]
        self._misses += 1
        return None

    def set(self, key: str, value: Any) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = value
        if len(self._cache) > self._max_size:
            oldest = next(iter(self._cache))
            del self._cache[oldest]
            logger.debug("LRU evicted key: %s", oldest)

    def delete(self, key: str) -> None:
        self._cache.pop(key, None)

    def clear(self) -> None:
        self._cache.clear()
        self._hits = 0
        self._misses = 0

    @property
    def stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 3) if total else 0.0,
        }


# Module-level singleton for clause analysis caching
_clause_cache = LRUCache(max_size=256)


def get_clause_cache() -> LRUCache:
    return _clause_cache
