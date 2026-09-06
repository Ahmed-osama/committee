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

Set `maxTurns` generously, sized to the goal's complexity, rather than leaving the
default (36) — the committee should keep debating until the skeptic actually clears
finalization, not get cut off mid-debate; a call that exhausts its turns returns no plan
at all and can't be resumed. Rough guide: ~20-30 for a narrow, single-decision goal;
~40-60 for a normal multi-part feature; ~80-100 (the tool's ceiling) for a genuinely
large or contentious initiative with many interacting seats. Bias upward when the roster
is large (5-6 seats) or spans multiple subsystems.

Also state the turn budget in the goal text itself, so the committee knows from the start
it has room to keep debating rather than rushing to converge early.

Report the finalized plan's task breakdown. If the user wants it filed in Linear, follow
the one-Epic-per-initiative convention (see `project_linear_epic_convention`) — a project
per initiative, tasks as issues under it.
