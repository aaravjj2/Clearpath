# ClearPath — Claude Code Project Memory

## Project Identity
ClearPath is an AI-powered legal document simplifier. Users upload a PDF or paste legal text and
receive plain-English clause breakdowns, red-flag detection, document risk scoring, and grounded
Q&A chat against the uploaded document.

**Repo:** https://github.com/aaravjj2/Clearpath  
**Stack:** Next.js 15 + TypeScript + Tailwind CSS (frontend) · FastAPI + Python (backend) · Claude claude-sonnet-4-20250514 · ChromaDB (in-memory) · PyMuPDF · SSE streaming

---

## Directory Layout
```
clearpath/
├── CLAUDE.md              ← this file (project memory)
├── AGENTS.md              ← autonomous loop definition
├── artifacts/             ← screenshots, test reports, improvement logs
├── frontend/              ← Next.js 15 app
│   ├── src/app/           ← App Router pages
│   ├── src/components/    ← React components
│   ├── src/lib/           ← API client, utils
│   └── tests/e2e/         ← Playwright tests
└── backend/
    ├── main.py            ← FastAPI entrypoint
    ├── routers/           ← documents, chat
    ├── services/          ← claude_service, chroma_service, pdf_service
    ├── models/            ← Pydantic schemas
    ├── tests/             ← pytest unit + integration tests
    └── requirements.txt
```

---

## Environment Variables

### Backend (`backend/.env`)
```
ANTHROPIC_API_KEY=<your-key>
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running the App

```bash
# Backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend && npm run dev
```

---

## API Surface
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/documents/upload | Upload PDF or raw text |
| GET | /api/documents/{id}/stream | SSE: clause analysis + risk score |
| GET | /api/documents/{id}/summary | Cached analysis summary |
| POST | /api/chat/ | Grounded Q&A against document |
| GET | /health | Health check |

---

## Test Commands

```bash
# Backend unit tests
cd backend && pytest tests/ -v --tb=short

# Frontend type-check + lint
cd frontend && npm run type-check && npm run lint

# Playwright E2E (requires both servers running)
cd frontend && npx playwright test --reporter=html

# Full suite shortcut
bash scripts/test-all.sh
```

---

## Known Weak Points (seed list for improvement loop)
1. No persistent storage — ChromaDB is in-memory, documents lost on restart
2. No authentication/authorization layer
3. SSE error handling on the frontend is minimal
4. No rate limiting on the FastAPI side
5. Risk score UI lacks visual clarity (no color coding / gauge)
6. Missing loading skeletons for streaming analysis
7. No file-size validation on upload (can cause OOM on large PDFs)
8. Chat history not preserved between page refreshes
9. No retry logic for failed Claude API calls
10. Zero Playwright tests currently exist

---

## Improvement Plan Tracking
Improvement plans are written to `artifacts/plans/PLAN_<YYYYMMDD_HHMMSS>.md` by the loop.
Each plan has phases: **Analyze → Build → Test → Document → Compact → Restart**.
The loop log lives at `artifacts/loop_log.jsonl`.

---

## Code Style
- Python: black + ruff, type hints everywhere, docstrings on public functions
- TypeScript: strict mode, no `any`, Tailwind utility classes only
- Commits: conventional commits (`feat:`, `fix:`, `test:`, `docs:`)

---

## MCP Servers in Use
- `playwright` — browser automation for E2E testing (see `.mcp.json`)

---

## Compact Trigger
When context approaches limit, run `/compact` to summarize progress, then the loop restarts
automatically from the top of `AGENTS.md`.
