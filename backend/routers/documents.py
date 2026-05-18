import json
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from models.schemas import DocumentAnalysis
from services.ai import analyze_clause, compute_risk_score
from services.parser import extract_text_from_pdf, segment_clauses
from services.risk_scorer import compute_fallback_risk_score
from services.vectorstore import index_document

router = APIRouter(prefix="/api/documents", tags=["documents"])

# In-memory store (use Redis/DB in production)
documents: dict[str, DocumentAnalysis] = {}
document_texts: dict[str, str] = {}


@router.post("/upload")
async def upload_document(file: UploadFile = File(None), text: str = Form(None)):
    if not file and not text:
        raise HTTPException(400, "Provide either a PDF file or text")

    document_id = str(uuid.uuid4())
    if file:
        content = await file.read()
        raw_text = extract_text_from_pdf(content)
        filename = file.filename or "uploaded.pdf"
    else:
        raw_text = (text or "").strip()
        filename = "pasted_document.txt"

    if not raw_text:
        raise HTTPException(400, "Unable to extract any text from document")

    document_texts[document_id] = raw_text
    documents[document_id] = DocumentAnalysis(
        document_id=document_id,
        filename=filename,
        total_clauses=0,
        clauses=[],
        status="processing"
    )
    return {"document_id": document_id, "filename": filename}


@router.get("/{document_id}/stream")
async def stream_analysis(document_id: str):
    """SSE stream that analyzes clauses one by one."""
    if document_id not in document_texts:
        raise HTTPException(404, "Document not found")

    async def generate():
        raw_text = document_texts[document_id]
        clause_texts = segment_clauses(raw_text)

        doc = documents[document_id]
        doc.total_clauses = len(clause_texts)

        all_clauses = []
        successful_texts = []
        clause_ids = []

        for i, clause_text in enumerate(clause_texts):
            try:
                clause = await analyze_clause(clause_text, i)
                all_clauses.append(clause)
                successful_texts.append(clause_text)
                clause_ids.append(clause.id)
                doc.clauses.append(clause)
                payload = {
                    "type": "clause",
                    "clause": clause.model_dump(),
                    "progress": (i + 1) / max(1, len(clause_texts))
                }
                yield f"data: {json.dumps(payload)}\n\n"
            except Exception as exc:
                yield f"data: {json.dumps({'type': 'error', 'message': str(exc), 'index': i})}\n\n"

        index_document(document_id, successful_texts, clause_ids)

        if all_clauses:
            try:
                risk = await compute_risk_score(all_clauses)
            except Exception:
                risk = compute_fallback_risk_score(all_clauses)
            doc.risk_score = risk
            doc.red_flags = [c for c in all_clauses if c.red_flag is not None]
            doc.status = "complete"
            yield f"data: {json.dumps({'type': 'risk_score', 'risk_score': risk.model_dump()})}\n\n"
        else:
            doc.status = "error"
            yield f"data: {json.dumps({'type': 'error', 'message': 'No clauses could be analyzed'})}\n\n"

        yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.get("/{document_id}/summary")
async def get_summary(document_id: str):
    if document_id not in documents:
        raise HTTPException(404, "Document not found")
    return documents[document_id]
