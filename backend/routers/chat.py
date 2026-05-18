from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest, ChatResponse
from services.ai import answer_question
from services.vectorstore import query_document

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    context_chunks = query_document(request.document_id, request.message, n_results=3)
    if not context_chunks:
        raise HTTPException(404, "Document not indexed yet")

    answer = answer_question(question=request.message, context_chunks=context_chunks, history=request.history)
    return ChatResponse(answer=answer)
