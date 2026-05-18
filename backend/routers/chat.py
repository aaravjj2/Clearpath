from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest, ChatResponse
from services.ai import answer_question
from services.vectorstore import query_document

router = APIRouter(prefix="/api/chat", tags=["chat"])

_MAX_MESSAGE_LENGTH = 2000
_MAX_HISTORY_TURNS = 20


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Answer a user question grounded in the uploaded document."""
    if not request.message or not request.message.strip():
        raise HTTPException(400, "Message must not be empty")
    if len(request.message) > _MAX_MESSAGE_LENGTH:
        raise HTTPException(400, f"Message exceeds maximum length of {_MAX_MESSAGE_LENGTH} characters")

    # Trim history to avoid unbounded token growth
    trimmed_history = request.history[-_MAX_HISTORY_TURNS * 2:]

    context_chunks = query_document(request.document_id, request.message, n_results=3)
    if not context_chunks:
        raise HTTPException(404, "Document not indexed yet")

    answer = await answer_question(
        question=request.message,
        context_chunks=context_chunks,
        history=trimmed_history,
    )
    return ChatResponse(answer=answer)
