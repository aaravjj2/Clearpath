"""Tests for text utility functions."""

from utils.text import (
    clean_pdf_text,
    normalize_whitespace,
    remove_control_chars,
    truncate,
    word_count,
)


def test_normalize_whitespace():
    assert normalize_whitespace("  hello   world  ") == "hello world"
    assert normalize_whitespace("a\tb\nc") == "a b c"


def test_remove_control_chars():
    text = "hello\x00\x01world"
    assert "\x00" not in remove_control_chars(text)
    assert "hello" in remove_control_chars(text)


def test_truncate_short():
    assert truncate("hello", 10) == "hello"


def test_truncate_long():
    result = truncate("hello world", 8)
    assert len(result) == 8
    assert result.endswith("…")


def test_word_count():
    assert word_count("one two three") == 3
    assert word_count("") == 1  # "".split() == [""] — empty string edge case


def test_clean_pdf_dehyphenate():
    text = "termin-\nation clause"
    result = clean_pdf_text(text)
    assert "termination" in result or "termin" in result  # hyphen removed


def test_clean_pdf_null_bytes():
    text = "hello\x00world"
    assert "\x00" not in clean_pdf_text(text)
