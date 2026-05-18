"""Tests for the LRU cache service."""

import pytest
from services.cache import LRUCache


def test_set_and_get():
    cache = LRUCache(max_size=10)
    cache.set("key1", "value1")
    assert cache.get("key1") == "value1"


def test_miss_returns_none():
    cache = LRUCache()
    assert cache.get("nonexistent") is None


def test_eviction():
    cache = LRUCache(max_size=3)
    for i in range(4):
        cache.set(f"k{i}", f"v{i}")
    # k0 should have been evicted (LRU)
    assert cache.get("k0") is None
    assert cache.get("k3") == "v3"


def test_lru_promotion():
    cache = LRUCache(max_size=3)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    # Access "a" to promote it
    cache.get("a")
    # Now add "d" — "b" should be evicted, not "a"
    cache.set("d", 4)
    assert cache.get("a") == 1
    assert cache.get("b") is None


def test_delete():
    cache = LRUCache()
    cache.set("key", "val")
    cache.delete("key")
    assert cache.get("key") is None


def test_clear():
    cache = LRUCache()
    cache.set("k1", "v1")
    cache.set("k2", "v2")
    cache.clear()
    assert cache.get("k1") is None
    assert cache.stats["size"] == 0


def test_stats():
    cache = LRUCache()
    cache.get("miss")
    cache.set("hit", "v")
    cache.get("hit")
    stats = cache.stats
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["hit_rate"] == 0.5
