"""Tests for input validation utilities."""

from utils.validation import (
    clamp_int,
    is_valid_uuid,
    sanitize_filename,
    validate_provider_name,
)
import uuid


def test_valid_uuid():
    assert is_valid_uuid(str(uuid.uuid4()))


def test_invalid_uuid():
    assert not is_valid_uuid("not-a-uuid")
    assert not is_valid_uuid("")
    assert not is_valid_uuid("123")


def test_sanitize_filename_strips_path():
    assert sanitize_filename("/etc/passwd") == "passwd"
    assert sanitize_filename("..\\config.json") == "config.json"


def test_sanitize_filename_removes_dangerous_chars():
    result = sanitize_filename("file<>name?.pdf")
    assert "<" not in result
    assert ">" not in result


def test_sanitize_filename_null_bytes():
    assert "\x00" not in sanitize_filename("file\x00name.pdf")


def test_sanitize_filename_max_length():
    long_name = "a" * 300
    assert len(sanitize_filename(long_name)) <= 255


def test_validate_provider_anthropic():
    assert validate_provider_name("anthropic")
    assert validate_provider_name("ANTHROPIC")


def test_validate_provider_invalid():
    assert not validate_provider_name("imaginary")


def test_clamp_int_within_range():
    assert clamp_int(5, 1, 10, 3) == 5


def test_clamp_int_below_min():
    assert clamp_int(0, 1, 10, 3) == 1


def test_clamp_int_above_max():
    assert clamp_int(99, 1, 10, 3) == 10


def test_clamp_int_none_default():
    assert clamp_int(None, 1, 10, 5) == 5
