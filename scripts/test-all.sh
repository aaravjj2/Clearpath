#!/usr/bin/env bash
# scripts/test-all.sh — Run the full ClearPath test suite (backend + frontend E2E)
# Usage: bash scripts/test-all.sh [--skip-e2e] [--skip-backend]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS="$ROOT/artifacts"
TS=$(date +%Y%m%d_%H%M%S)
SKIP_E2E=false
SKIP_BACKEND=false

for arg in "$@"; do
  case $arg in
    --skip-e2e) SKIP_E2E=true ;;
    --skip-backend) SKIP_BACKEND=true ;;
  esac
done

mkdir -p "$ARTIFACTS/screenshots" "$ARTIFACTS/reports"

echo "════════════════════════════════════════"
echo "  ClearPath Full Test Suite — $TS"
echo "════════════════════════════════════════"

PYTEST_EXIT=0
TYPECHECK_EXIT=0
LINT_EXIT=0
PLAYWRIGHT_EXIT=0

# ── Backend ──────────────────────────────────
if [ "$SKIP_BACKEND" = false ]; then
  echo ""
  echo "▶ Backend: ruff check"
  cd "$ROOT/backend"
  source .venv/bin/activate 2>/dev/null || true

  ruff check . --output-format=concise 2>&1 | tee "$ARTIFACTS/ruff_${TS}.log" || true

  echo ""
  echo "▶ Backend: pytest"
  pytest test_api.py test_services.py tests/ \
    -v \
    --tb=short \
    --json-report \
    --json-report-file="$ARTIFACTS/pytest_${TS}.json" \
    2>&1 | tee "$ARTIFACTS/pytest_${TS}.log"
  PYTEST_EXIT=${PIPESTATUS[0]}
fi

# ── Frontend type-check + lint ────────────────
echo ""
echo "▶ Frontend: type-check + lint"
cd "$ROOT/frontend"

npm run type-check 2>&1 | tee "$ARTIFACTS/typecheck_${TS}.log"
TYPECHECK_EXIT=${PIPESTATUS[0]}

npm run lint 2>&1 | tee "$ARTIFACTS/lint_${TS}.log"
LINT_EXIT=${PIPESTATUS[0]}

# ── Playwright E2E ────────────────────────────
if [ "$SKIP_E2E" = false ]; then
  echo ""
  echo "▶ Playwright E2E"
  npx playwright test \
    --reporter=html,json \
    --output="$ARTIFACTS/playwright_${TS}" \
    2>&1 | tee "$ARTIFACTS/playwright_${TS}.log"
  PLAYWRIGHT_EXIT=${PIPESTATUS[0]}
fi

# ── Summary ───────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  Results"
echo "════════════════════════════════════════"
[ "$SKIP_BACKEND" = false ] && echo "  pytest:     $([ $PYTEST_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "  type-check: $([ $TYPECHECK_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "  lint:       $([ $LINT_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
[ "$SKIP_E2E" = false ] && echo "  playwright: $([ $PLAYWRIGHT_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "════════════════════════════════════════"

TOTAL=$((PYTEST_EXIT + TYPECHECK_EXIT + LINT_EXIT + PLAYWRIGHT_EXIT))
exit $TOTAL
