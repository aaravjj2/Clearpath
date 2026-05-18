"""
Text utility functions for ClearPath backend.
"""
import re
import unicodedata


def normalize_whitespace(text: str) -> str:
    """Replace runs of whitespace (including non-breaking spaces) with a single space."""
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_control_chars(text: str) -> str:
    """Remove ASCII control characters (except tab/newline) from text."""
    return "".join(ch for ch in text if ch == "\t" or ch == "\n" or not unicodedata.category(ch).startswith("C"))


def truncate(text: str, max_length: int, ellipsis: str = "…") -> str:
    """Truncate text to max_length characters, appending ellipsis if needed."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(ellipsis)] + ellipsis


def word_count(text: str) -> int:
    """Count words in text (split on whitespace)."""
    return len(text.split())


def clean_pdf_text(text: str) -> str:
    """
    Clean common PDF extraction artifacts:
    - Remove hyphenation line-break artifacts (e.g. "termin-\\nation")
    - Normalize whitespace
    - Remove null bytes
    """
    text = text.replace("\x00", "")
    text = re.sub(r"-\n(\w)", r"\1", text)  # de-hyphenate line breaks
    text = re.sub(r"\n{3,}", "\n\n", text)  # collapse 3+ newlines
    return normalize_whitespace(text.strip()) if len(text) < 1000 else text.strip()
