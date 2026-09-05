---
description: Summarize recent commits and Linear issue movement on the Committee team as a daily standup
allowed-tools: Bash(git log *), Bash(git status *), mcp__linear__list_issues
disable-model-invocation: false
---

Produce a short daily-standup summary:

1. Commits on the current branch from the last 24 hours (`git log`) — one line each.
2. Any uncommitted changes currently sitting in the working tree (`git status --short`) —
   flag them, don't just list files.
3. Linear issues on the Committee team updated in the last 24 hours (`mcp__linear__list_issues`,
   filtered by `updatedAt`), grouped by status (Done / In Progress / Todo).
4. A one-line "what's next" based on the earliest unblocked Todo/In Progress issue.

Keep it terse — this is a standup, not a report. No preamble, just the four sections.
