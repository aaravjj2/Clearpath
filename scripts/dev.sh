#!/usr/bin/env bash
# scripts/dev.sh — Start ClearPath backend + frontend in dev mode (two tmux panes)
# Usage: bash scripts/dev.sh
#   or:  bash scripts/dev.sh --no-tmux  (just start both with & and wait)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

NO_TMUX=false
for arg in "$@"; do
  [ "$arg" = "--no-tmux" ] && NO_TMUX=true
done

start_backend() {
  echo "▶ Starting backend on :8000"
  cd "$ROOT/backend"
  source .venv/bin/activate 2>/dev/null || true
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

start_frontend() {
  echo "▶ Starting frontend on :3000"
  cd "$ROOT/frontend"
  npm run dev
}

if [ "$NO_TMUX" = true ] || ! command -v tmux &>/dev/null; then
  start_backend &
  start_frontend &
  wait
else
  SESSION="clearpath-dev"
  tmux new-session -d -s "$SESSION" -n backend 2>/dev/null || true
  tmux send-keys -t "$SESSION:backend" "bash -c 'source \"$ROOT/scripts/dev.sh\" --no-tmux' 2>&1" Enter
  tmux split-window -h -t "$SESSION:backend"
  tmux send-keys -t "$SESSION:backend.right" "cd '$ROOT/frontend' && npm run dev" Enter
  tmux attach -t "$SESSION"
fi
