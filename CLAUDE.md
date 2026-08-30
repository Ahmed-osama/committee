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

## Direction (important context, not just history)
Earlier phases built a bespoke task-tracking/execution pipeline (SQLite task state
machine, git-worktree-based coding agent, tick scheduler, dashboard) for an autonomous
dev-shop use case. That direction was explicitly abandoned — the user wants agents that
*converse* to plan, with Linear as the task backend, not a rebuilt project-management
app. That old code was removed; don't resurrect it without the user asking.
