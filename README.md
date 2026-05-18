# ClearPath

ClearPath is an AI-powered legal document simplifier. Users upload a PDF or paste legal text and receive:

- Plain-English clause breakdowns
- Red-flag detection for predatory/unusual terms
- Document risk scoring (overall and by category)
- Grounded Q&A chat against the uploaded document

## Tech Stack

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** FastAPI
- **AI:** Anthropic Claude (`claude-sonnet-4-20250514`)
- **Vector store:** ChromaDB (in-memory for hackathon)
- **PDF parsing:** PyMuPDF
- **Streaming:** SSE

## Project Structure

```text
clearpath/
├── frontend/
└── backend/
```

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Required env vars:

- `ANTHROPIC_API_KEY`
- `FRONTEND_URL` (defaults to `http://localhost:3000`)

## Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local 2>/dev/null || true
npm run dev
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

- `POST /api/documents/upload` - upload PDF or text
- `GET /api/documents/{document_id}/stream` - stream clause analysis + risk score via SSE
- `GET /api/documents/{document_id}/summary` - get analysis summary
- `POST /api/chat/` - ask grounded questions about analyzed document
- `GET /health` - health check

## Deployment

### Railway/Render (backend)

- Root directory: `backend/`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set env vars: `ANTHROPIC_API_KEY`, `FRONTEND_URL`

### Vercel (frontend)

- Root directory: `frontend/`
- Set env var: `NEXT_PUBLIC_API_URL`
