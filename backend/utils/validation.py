"""
Input validation utilities shared across ClearPath backend.
"""

import re
import uuid


def is_valid_uuid(value: str) -> bool:
    """Check whether a string is a valid UUID4."""
    try:
        val = uuid.UUID(value, version=4)
        return str(val) == value
    except (ValueError, AttributeError):
        return False


def sanitize_filename(name: str, max_length: int = 255) -> str:
    """
    Sanitize an uploaded filename:
    - Strip path components
    - Remove null bytes and control chars
    - Limit to max_length
    - Replace unsafe chars with underscores
    """
    name = name.split("/")[-1].split("\\")[-1]  # strip path
    name = name.replace("\x00", "")
    name = re.sub(r"[^\w\s\-.]", "_", name)
    name = name.strip()
    return name[:max_length] if name else "uploaded_file"


def validate_provider_name(name: str) -> bool:
    """Check whether a provider name is a known valid identifier."""
    valid = {"anthropic", "openai", "gemini", "openrouter", "ollama"}
    return name.lower() in valid


def clamp_int(value: int | None, min_val: int, max_val: int, default: int) -> int:
    """Return value clamped to [min_val, max_val], or default if None."""
    if value is None:
        return default
    return max(min_val, min(max_val, value))
