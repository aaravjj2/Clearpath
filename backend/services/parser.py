import re
from typing import List

import fitz

_MIN_CLAUSE_LEN = 50
_MAX_CLAUSE_LEN = 3000   # split very long chunks to keep AI input manageable
_MERGE_THRESHOLD = 200


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF byte string using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for page in doc:
        page_text = page.get_text()
        if page_text.strip():
            pages.append(page_text)
    return "\n\n".join(pages).strip()


def _split_long(chunk: str) -> List[str]:
    """Split a chunk that exceeds MAX_CLAUSE_LEN on sentence boundaries."""
    if len(chunk) <= _MAX_CLAUSE_LEN:
        return [chunk]
    sentences = re.split(r"(?<=[.!?])\s+", chunk)
    parts: List[str] = []
    buf = ""
    for sent in sentences:
        if len(buf) + len(sent) > _MAX_CLAUSE_LEN and buf:
            parts.append(buf.strip())
            buf = sent
        else:
            buf += (" " if buf else "") + sent
    if buf:
        parts.append(buf.strip())
    return [p for p in parts if p]


def segment_clauses(text: str) -> List[str]:
    """
    Split a legal document into logical clause chunks.

    Strategy (in priority order):
    1. Numbered sections (e.g. "1. Payment" or "1) Termination")
    2. Lettered sections (e.g. "A. Definitions")
    3. Paragraph double-newlines merged to ~200 chars
    4. Fallback: entire text as single chunk
    """
    if not text or not text.strip():
        return []

    # Strategy 1: numbered sections
    numbered = re.split(r"\n(?=\d+[\.\)]\s+[A-Z])", text)
    if len(numbered) > 3:
        chunks = [c.strip() for c in numbered if len(c.strip()) >= _MIN_CLAUSE_LEN]
        if chunks:
            return [s for c in chunks for s in _split_long(c)]

    # Strategy 2: lettered sections
    lettered = re.split(r"\n(?=[A-Z][\.\)]\s+[A-Z])", text)
    if len(lettered) > 3:
        chunks = [c.strip() for c in lettered if len(c.strip()) >= _MIN_CLAUSE_LEN]
        if chunks:
            return [s for c in chunks for s in _split_long(c)]

    # Strategy 3: paragraph merging
    paragraphs = re.split(r"\n{2,}", text)
    merged: List[str] = []
    buffer = ""
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        buffer += f" {p}" if buffer else p
        if len(buffer) >= _MERGE_THRESHOLD:
            merged.append(buffer.strip())
            buffer = ""
    if buffer:
        merged.append(buffer.strip())

    chunks = [s for c in merged if len(c) >= _MIN_CLAUSE_LEN for s in _split_long(c)]
    if not chunks and text.strip():
        return _split_long(text.strip())
    return chunks
