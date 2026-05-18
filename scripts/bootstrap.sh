#!/usr/bin/env bash
# scripts/bootstrap.sh
# One-time setup: creates the artifacts directory structure and initializes the loop log.
# Run this once after cloning, before starting Claude Code.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Bootstrapping ClearPath Claude Code setup..."

mkdir -p "$ROOT/artifacts/plans"
mkdir -p "$ROOT/artifacts/reports"
mkdir -p "$ROOT/artifacts/screenshots"

# Initialize loop log if it doesn't exist
LOOP_LOG="$ROOT/artifacts/loop_log.jsonl"
if [ ! -f "$LOOP_LOG" ]; then
  echo '{"phase":"BOOTSTRAP","status":"initialized","ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > "$LOOP_LOG"
  echo "  Created $LOOP_LOG"
else
  echo "  $LOOP_LOG already exists — skipping"
fi

# Create compact_summary placeholder
COMPACT="$ROOT/artifacts/compact_summary.md"
if [ ! -f "$COMPACT" ]; then
  cat > "$COMPACT" <<'EOF'
# Compact Summary — Initial

## What was accomplished this loop
- Bootstrap: directory structure and loop log initialized

## Current project state
- Backend tests: unknown (run scripts/test-all.sh)
- E2E tests: unknown
- Outstanding P1 items: see AGENTS.md Known Weak Points

## Next loop must start with
- Phase 0 orientation then full Phase 1 analysis
EOF
  echo "  Created $COMPACT"
fi

echo ""
echo "✅ Bootstrap complete. To start the loop, open Claude Code in this directory:"
echo "   claude --dangerously-skip-permissions"
echo ""
echo "Claude Code will read CLAUDE.md and AGENTS.md and begin the improvement loop."
