import re
from typing import List

import fitz


def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text.strip()


def segment_clauses(text: str) -> List[str]:
    """
    Split document into logical clause chunks.
    Strategy: split on numbered sections, paragraph breaks, or clause markers.
    """
    numbered = re.split(r"\n(?=\d+[\.\)]\s+[A-Z])", text)
    if len(numbered) > 3:
        chunks = [c.strip() for c in numbered if len(c.strip()) > 50]
        if chunks:
            return chunks

    paragraphs = re.split(r"\n{2,}", text)
    merged: List[str] = []
    buffer = ""
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        buffer += f" {p}" if buffer else p
        if len(buffer) > 200:
            merged.append(buffer.strip())
            buffer = ""
    if buffer:
        merged.append(buffer.strip())

    chunks = [c for c in merged if len(c) > 50]
    if not chunks and text.strip():
        return [text.strip()]
    return chunks
