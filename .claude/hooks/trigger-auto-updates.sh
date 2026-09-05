#!/usr/bin/env bash
# Fired by the Stop hook after every main-session turn (see .claude/settings.json).
# Kicks off headless Claude Code runs of the auto-update skills — living docs
# and the learning journal — without blocking the interactive session and
# without recursing into itself.
set -euo pipefail

# Each headless `claude -p` call below is itself a full Claude Code process
# that reads this same settings.json — its own Stop hook would fire this
# script again when it finishes, forever, without this guard.
if [ -n "${COMMITTEE_DOCS_HOOK_ACTIVE:-}" ]; then
  exit 0
fi
export COMMITTEE_DOCS_HOOK_ACTIVE=1

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

mkdir -p .claude/hooks
LOG_FILE=".claude/hooks/last-auto-update.log"

{
  echo "=== auto-update run: $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  claude -p "/document-update"
  claude -p "/learning-digest"
  echo "=== done: $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
} >>"$LOG_FILE" 2>&1 &
disown

exit 0
