# ClearPath — Autonomous Improvement Loop

> **This file is Claude Code's operating manual.**  
> On every session start (including after `/compact` restarts), execute the phases below in order.  
> Never skip a phase. Never stop between phases unless a blocking error requires human input.

---

## ╔══ PHASE 0 — ORIENTATION ══╗

**Goal:** Load context, understand current state, pick up where the last loop left off.

```
1. Read CLAUDE.md fully.
2. Run: cat artifacts/loop_log.jsonl | tail -5
   → Understand the last completed phase and any outstanding TODOs.
3. Run: ls artifacts/plans/ | sort | tail -1
   → Read the most recent plan file to know what was in progress.
4. Run: git log --oneline -10
   → See recent commits.
5. Run: git status
   → Confirm working tree is clean before starting new work.
   → If dirty, commit or stash before proceeding.
6. Log to artifacts/loop_log.jsonl:
   {"phase":"ORIENTATION","status":"started","ts":"<ISO_TIMESTAMP>"}
```

---

## ╔══ PHASE 1 — ANALYSIS & PLAN ══╗

**Goal:** Produce a prioritized, actionable improvement plan for this loop iteration.

```
1. Static analysis:
   cd backend && ruff check . --output-format=json > ../artifacts/ruff_report.json 2>&1 || true
   cd frontend && npm run lint -- --format json > ../artifacts/eslint_report.json 2>&1 || true
   cd frontend && npm run type-check > ../artifacts/typecheck_report.txt 2>&1 || true

2. Dependency audit:
   cd backend && pip list --outdated --format=json > ../artifacts/pip_outdated.json 2>&1 || true
   cd frontend && npm outdated --json > ../artifacts/npm_outdated.json 2>&1 || true

3. Test baseline:
   cd backend && pytest tests/ -v --tb=short --json-report --json-report-file=../artifacts/pytest_baseline.json 2>&1 || true
   cd frontend && npx playwright test --reporter=json --output=../artifacts/playwright_baseline.json 2>&1 || true

4. Synthesize findings into a plan:
   Write artifacts/plans/PLAN_<YYYYMMDD_HHMMSS>.md with this structure:

   # Improvement Plan — <timestamp>
   ## Summary of findings
   ## Prioritized improvements (P1 / P2 / P3)
   Each item must have:
   - ID: IMP-XXX
   - Title
   - Files affected
   - Acceptance criteria (what Playwright/pytest test proves it works)
   - Estimated complexity (S/M/L)

5. Focus this iteration on the top 2–4 P1 items only.
   Save remaining items for the next loop.

6. Log: {"phase":"ANALYSIS","plan_file":"artifacts/plans/PLAN_<ts>.md","items_selected":[...],"ts":"<ISO>"}
```

### Improvement Categories to Always Check
- **Backend correctness:** missing validation, unhandled exceptions, missing tests
- **Frontend UX:** loading states, error boundaries, accessibility (aria labels)
- **Performance:** unnecessary re-renders, N+1 calls, large bundle chunks
- **Security:** missing auth, CORS misconfiguration, no rate limiting
- **Resilience:** retry logic, graceful degradation when Claude API is slow/down
- **Observability:** missing logs, no request IDs, no error tracking
- **DX:** missing type definitions, any-typed props, missing docstrings

---

## ╔══ PHASE 2 — BUILD ══╗

**Goal:** Implement every selected improvement with clean, tested code.

```
For each selected improvement IMP-XXX:

  1. Create a git branch:
     git checkout -b improvement/IMP-XXX-<slug>

  2. Implement the change:
     - Write the feature/fix code
     - Add or update unit tests (pytest for backend, vitest/jest for frontend)
     - Update type definitions if needed
     - Add docstrings/comments where logic is non-obvious

  3. Run local verification:
     Backend changes:  cd backend && pytest tests/ -v --tb=short
     Frontend changes: cd frontend && npm run type-check && npm run lint && npm run build

  4. Fix any failures before moving on. Do not leave red tests.

  5. Commit:
     git add -A
     git commit -m "feat: IMP-XXX <short description>

     - <bullet of what changed>
     - <bullet of what changed>
     
     Acceptance: <playwright/pytest test name that validates this>"

  6. Merge to master:
     git checkout master && git merge --no-ff improvement/IMP-XXX-<slug>

  7. Log: {"phase":"BUILD","imp":"IMP-XXX","status":"merged","ts":"<ISO>"}
```

### Build Rules
- **Never** commit broken tests.
- **Never** use `any` in TypeScript without a comment explaining why.
- **Never** remove existing tests; only add or fix.
- If an implementation takes more than 3 attempts to get tests passing, reduce scope and document the blocker.

---

## ╔══ PHASE 3 — PLAYWRIGHT TESTING ══╗

**Goal:** Verify every user-facing flow works end-to-end with zero errors.

### Required Test Files
Maintain these files under `frontend/tests/e2e/`:

```
frontend/tests/e2e/
├── 01_health.spec.ts          ← backend /health endpoint reachable
├── 02_upload_pdf.spec.ts      ← PDF upload flow
├── 03_upload_text.spec.ts     ← paste raw text flow
├── 04_streaming_analysis.spec.ts ← SSE stream renders clauses
├── 05_risk_score.spec.ts      ← risk score displays after analysis
├── 06_chat.spec.ts            ← Q&A chat against document
├── 07_error_handling.spec.ts  ← handles bad files, network errors gracefully
└── 08_accessibility.spec.ts   ← basic a11y checks (axe-core)
```

### Running Tests

```bash
# Ensure both servers are running before this phase:
# Terminal A: cd backend && uvicorn main:app --reload --port 8000
# Terminal B: cd frontend && npm run dev

cd frontend
npx playwright test \
  --reporter=html,json \
  --output=../artifacts/playwright_results \
  2>&1 | tee ../artifacts/playwright_run.log
```

### Zero-Error Policy
```
1. After the run, check exit code:
   - exit 0 → proceed
   - non-zero → read failures, fix root cause, re-run

2. For each failing test:
   - Read the error + screenshot in artifacts/playwright_results/
   - Fix the underlying code (not the test assertion, unless the test was wrong)
   - Re-run that specific test: npx playwright test <file> --reporter=list
   - Do not proceed to Phase 4 until ALL tests pass.

3. Capture final proof:
   npx playwright test --reporter=json > ../artifacts/playwright_final_<ts>.json
   npx playwright show-report artifacts/playwright_results (screenshot the summary)
```

### Playwright MCP Usage
When using the Playwright MCP server for interactive inspection:
```
- Use mcp__playwright__browser_navigate to navigate to http://localhost:3000
- Use mcp__playwright__browser_screenshot to capture UI state
- Use mcp__playwright__browser_click / browser_type for interactions
- Always take a screenshot before and after each major interaction as proof
- Save screenshots to artifacts/screenshots/<step_name>_<ts>.png
```

---

## ╔══ PHASE 4 — DOCUMENTATION & ARTIFACTS ══╗

**Goal:** Leave a complete paper trail of what was built and verified.

```
1. Update README.md:
   - Reflect any new features, endpoints, or setup steps
   - Update the "API Endpoints" table if endpoints changed

2. Write artifacts/reports/REPORT_<ts>.md:

   # Improvement Report — <timestamp>
   
   ## Improvements Implemented
   | ID | Title | Files Changed | Commit |
   |----|-------|--------------|--------|
   
   ## Test Results
   - Backend: X/Y tests passed
   - Frontend E2E: X/Y tests passed
   - Screenshots: [links to artifacts/screenshots/]
   
   ## Before / After
   For each IMP: describe the state before and after.
   
   ## Known Remaining Issues
   List anything deferred to the next loop.
   
   ## Next Loop Preview
   Top 3 items from the backlog for the next iteration.

3. Commit documentation:
   git add README.md artifacts/reports/REPORT_<ts>.md
   git commit -m "docs: add improvement report for loop <N>"

4. Log: {"phase":"DOCUMENTATION","report":"artifacts/reports/REPORT_<ts>.md","ts":"<ISO>"}
```

---

## ╔══ PHASE 5 — COMPACT ══╗

**Goal:** Compress context so the loop can continue without hitting token limits.

```
1. Write a compact summary to artifacts/compact_summary.md:

   # Compact Summary — <timestamp>
   
   ## What was accomplished this loop
   - <IMP-XXX>: <one sentence>
   - ...
   
   ## Current project state
   - Backend tests: X/Y
   - E2E tests: X/Y
   - Outstanding P1 items: [list]
   - Outstanding P2 items: [list]
   
   ## Files changed this loop
   git diff --name-only HEAD~<N> HEAD
   
   ## Next loop must start with
   - Phase 1 analysis focusing on: [top 3 backlog items]
   - Watch out for: [any known gotchas]

2. Log: {"phase":"COMPACT","summary":"artifacts/compact_summary.md","ts":"<ISO>"}

3. Run /compact
   (Claude Code will summarize the conversation and continue)
```

---

## ╔══ PHASE 6 — RESTART ══╗

**Goal:** Seamlessly continue the loop after `/compact`.

```
After /compact completes, Claude Code automatically re-reads CLAUDE.md and AGENTS.md.
The loop restarts at PHASE 0.

The loop_log.jsonl ensures no work is duplicated:
- PHASE 0 reads the last log entry
- If the last entry is {"phase":"COMPACT",...}, jump straight to PHASE 1
  but load the backlog from artifacts/compact_summary.md instead of re-analyzing from scratch.

This creates a continuous improvement flywheel:
  ORIENT → ANALYZE → BUILD → TEST → DOCUMENT → COMPACT → RESTART → repeat
```

---

## Emergency Stops

Stop and ask the human for input if:
- `ANTHROPIC_API_KEY` is missing or returns 401
- A migration would drop/alter a production database table
- More than 5 consecutive test runs fail on the same test
- Any improvement requires changes outside the repo (infra, DNS, secrets)
- Playwright screenshots show unexpected UI regressions in features you did NOT touch

---

## Loop Health Metrics (check at start of each Phase 1)

| Metric | Target |
|--------|--------|
| Backend test coverage | ≥ 80% |
| E2E tests passing | 100% |
| TypeScript errors | 0 |
| Ruff violations | 0 |
| Open P1 items | 0 before moving to P2 |
| Artifacts committed | Every loop |
