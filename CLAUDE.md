# committee

Learning sandbox for AI-assisted coding, and an actual product: a small AI-agent
"company." Give it one goal; a Planner, Architect, and Skeptic hold a real visible
conversation to turn it into a stress-tested plan. Linear (via its MCP server) is the
intended system of record for the resulting tasks — not a bespoke task database.
pnpm + Turborepo monorepo — `apps/*` for deployable apps, `packages/*` for shared
libraries consumed via workspace imports (e.g. `@committee/core`).

## Commands
- `pnpm run typecheck` / `pnpm run test` — across all packages, via Turbo.
- `pnpm run cli plan "<goal>"` — run a planning conversation from the terminal.
- `pnpm run cli serve` — start the web viewer at http://localhost:3000.
- `pnpm run db:generate` / `pnpm run db:migrate` — Drizzle migrations for `packages/core`.

## Working style
- Keep responses short; skip trailing "here's what I did" summaries unless asked.
- Explain non-obvious choices briefly as we go, since the point here is learning.
- After finishing a task that changes structure, conventions, or direction, update the
  relevant doc in the same turn — don't let docs drift from code. See "Docs map" below
  for where each kind of detail lives.
- Whenever a `committee_plan` session finalizes a new mini-startup/initiative (one getting
  its own Linear project), add it to "Mini-startups built here" below *and* create its
  `docs/projects/<name>.md` in the same turn — a fresh session anywhere in this repo needs
  to discover what exists without re-deriving it from Linear or chat history.
- When a moment in the work matches an existing Claude Code skill, subagent, or other
  ecosystem tool (not yet used in this session), point it out — briefly, once — rather
  than defaulting to a manual approach.

## Docs map
Single-file CLAUDE.md doesn't scale here — detail lives in the file scoped to it:
- This file — repo-wide overview, commands, working style, Linear conventions, direction.
- `docs/CODING_STYLE.md` — cross-repo TypeScript/testing/structure conventions.
- `packages/*/CLAUDE.md`, `apps/*/CLAUDE.md` — that package's subsystem map and
  package-specific conventions (e.g. `packages/core/CLAUDE.md`).
- `docs/projects/<name>.md` — one file per mini-startup: product spec, audience, stack,
  status. See "Mini-startups built here" for the index.

## Linear conventions
- One Epic per initiative/mini-project/app; each finalized plan's tasks become issues
  filed under that Epic, not loose top-level issues.

## Mini-startups built here
This repo is also a launchpad: each entry below is a distinct product initiative planned
via `committee_plan` and tracked as its own Linear project (see Linear conventions above).
Full spec/audience/stack detail lives in `docs/projects/<name>.md` — this list is just the
index so a fresh session can discover what exists without re-deriving it from Linear.

- **GroundTruth** — real-estate marketplace for a small Nile Delta town, Egypt. Linear
  project: `GroundTruth`. Full spec: `docs/projects/groundtruth.md`.

**When a new mini-startup's plan is finalized**, add an entry here and its
`docs/projects/<name>.md` before considering that planning round done — this list is the
load-bearing source of "what exists," not a courtesy.

## Direction (important context, not just history)
Earlier phases built a bespoke task-tracking/execution pipeline (SQLite task state
machine, git-worktree-based coding agent, tick scheduler, dashboard) for an autonomous
dev-shop use case. That direction was explicitly abandoned — the user wants agents that
*converse* to plan, with Linear as the task backend, not a rebuilt project-management
app. That old code was removed; don't resurrect it without the user asking.
