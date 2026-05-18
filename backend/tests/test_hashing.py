"""Tests for document hashing utilities."""

from utils.hashing import content_fingerprint, document_cache_key, sha256_hex


def test_sha256_bytes():
    h = sha256_hex(b"hello")
    assert len(h) == 64
    assert h == sha256_hex(b"hello")  # deterministic


def test_sha256_string():
    h = sha256_hex("hello")
    assert h == sha256_hex(b"hello")


def test_sha256_different_inputs():
    assert sha256_hex("a") != sha256_hex("b")


def test_document_cache_key_format():
    key = document_cache_key("doc-1", 3)
    assert key == "clause:doc-1:3"


def test_content_fingerprint_whitespace_normalized():
    fp1 = content_fingerprint("hello    world")
    fp2 = content_fingerprint("hello world")
    assert fp1 == fp2


def test_content_fingerprint_length():
    fp = content_fingerprint("test document content")
    assert len(fp) == 16


def test_content_fingerprint_unique():
    assert content_fingerprint("doc A") != content_fingerprint("doc B")
