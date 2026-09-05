---
description: Delegate a goal to the committee_plan MCP tool with a task-specific roster, not the generic six
argument-hint: "[goal]"
arguments: [goal]
disable-model-invocation: false
---

Goal: $0

Decide first whether this goal actually warrants a full committee debate (see
`committee_mcp_delegation` guidance) rather than just answering it directly.

If it does, call the `committee_plan` MCP tool. Build a custom `roster` (3-6 seats)
tailored to what *this specific goal* needs — creative titles and personas per seat, not
the generic Planner/Architect/Skeptic/Devil's Advocate/Estimator/Reviewer pool. Each
seat's `role` still controls real debate mechanics (a `skeptic`-role seat gates
finalization on raising real objections; `skeptic`/`devils_advocate` seats speak as
challengers) — `name` and `persona` are yours to invent per task.

Report the finalized plan's task breakdown. If the user wants it filed in Linear, follow
the one-Epic-per-initiative convention (see `project_linear_epic_convention`) — a project
per initiative, tasks as issues under it.
