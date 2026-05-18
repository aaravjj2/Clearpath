# ClearPath — Claude Code Autonomous Setup

This folder contains everything needed to run an **autonomous improvement loop** on the ClearPath codebase using Claude Code.

## What it does

```
ORIENT → ANALYZE → BUILD → TEST (Playwright) → DOCUMENT → COMPACT → RESTART
```

Each loop iteration:
1. Reads the codebase and last loop's state
2. Runs linters, type-checkers, and existing tests to find issues
3. Builds a prioritized plan (top 2–4 improvements)
4. Implements each improvement with tests
5. Runs the full Playwright E2E suite — zero failures required to proceed
6. Writes a markdown report + saves screenshots as proof
7. Runs `/compact` to compress context
8. Restarts automatically

---

## Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project memory — Claude reads this on every session start |
| `AGENTS.md` | Loop orchestration — the step-by-step operating manual |
| `.mcp.json` | MCP server config (Playwright) |
| `playwright.config.ts` | Copy to `frontend/` |
| `tests/e2e/` | Seed Playwright tests — copy to `frontend/tests/e2e/` |
| `scripts/bootstrap.sh` | One-time artifact directory setup |
| `scripts/test-all.sh` | Runs backend + frontend + E2E tests |

---

## Setup

```bash
# 1. Clone ClearPath
git clone https://github.com/aaravjj2/Clearpath clearpath
cd clearpath

# 2. Copy these files into the repo root
cp /path/to/this-setup/CLAUDE.md .
cp /path/to/this-setup/AGENTS.md .
cp /path/to/this-setup/.mcp.json .
cp /path/to/this-setup/playwright.config.ts frontend/
cp -r /path/to/this-setup/tests frontend/
cp -r /path/to/this-setup/scripts .
chmod +x scripts/*.sh

# 3. Bootstrap artifact directories
bash scripts/bootstrap.sh

# 4. Set up backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY

# 5. Set up frontend
cd ../frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 6. Install Playwright
npx playwright install chromium

# 7. Launch Claude Code
cd ..
claude --dangerously-skip-permissions
```

Claude Code will automatically read `CLAUDE.md` + `AGENTS.md` and begin the loop.

---

## Manual trigger

If you want Claude Code to start from a specific phase, just say:
> "Start from Phase 2 — BUILD, targeting IMP-003"

Or to re-run tests only:
> "Run Phase 3 — Playwright testing"

---

## Artifacts produced each loop

```
artifacts/
├── loop_log.jsonl              ← machine-readable loop history
├── compact_summary.md          ← human-readable state after each /compact
├── plans/PLAN_<ts>.md          ← improvement plans
├── reports/REPORT_<ts>.md      ← what was built + test results
├── screenshots/                ← Playwright proof screenshots
├── playwright_results.json     ← raw test output
└── pytest_<ts>.json            ← backend test output
```
