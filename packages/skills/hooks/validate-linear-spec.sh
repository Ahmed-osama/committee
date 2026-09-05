#!/bin/bash
# PreToolUse hook for mcp__linear__save_issue / save_project.
# Only validates *creates* (no `id` field — an update, e.g. a bare status
# change, is left alone) and only rejects the obviously malformed case: an
# empty/whitespace title or name. Not a style check.
set -euo pipefail

input=$(cat)

tool_name=$(echo "$input" | jq -r '.tool_name // ""')
has_id=$(echo "$input" | jq -r 'if (.tool_input.id // null) != null then "yes" else "no" end')

if [ "$has_id" = "yes" ]; then
  exit 0
fi

if [[ "$tool_name" == "mcp__linear__save_issue" ]]; then
  field="title"
elif [[ "$tool_name" == "mcp__linear__save_project" ]]; then
  field="name"
else
  exit 0
fi

value=$(echo "$input" | jq -r --arg f "$field" '.tool_input[$f] // ""')
trimmed=$(echo "$value" | tr -d '[:space:]')

if [ -z "$trimmed" ]; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked: creating a Linear ${tool_name#mcp__linear__save_} with an empty ${field}. Fill it in before filing."
  }
}
EOF
  exit 2
fi

exit 0
