"""
Document content hashing for de-duplication and cache keying.
"""

import hashlib


def sha256_hex(content: bytes | str) -> str:
    """Return the SHA-256 hex digest of bytes or a UTF-8 string."""
    if isinstance(content, str):
        content = content.encode("utf-8")
    return hashlib.sha256(content).hexdigest()


def document_cache_key(document_id: str, clause_index: int) -> str:
    """Deterministic cache key for a clause analysis result."""
    return f"clause:{document_id}:{clause_index}"


def content_fingerprint(text: str) -> str:
    """Fingerprint for deduplicating identical document uploads."""
    normalized = " ".join(text.split())  # collapse all whitespace
    return sha256_hex(normalized)[:16]   # first 16 hex chars (64 bits) sufficient for dedup
