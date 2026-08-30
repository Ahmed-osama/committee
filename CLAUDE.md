# committee

Learning sandbox for AI-assisted coding, and an actual product: AI agents acting as
autonomous coding "employees." pnpm + Turborepo monorepo — `apps/*` for deployable
apps, `packages/*` for shared libraries consumed via workspace imports
(e.g. `@committee/core`).

## Commands
- `pnpm run typecheck` / `pnpm run test` — across all packages, via Turbo.
- `pnpm run cli <args>` — run the CLI app (`apps/cli`). No `--` before args.
- `pnpm run db:generate` / `pnpm run db:migrate` — Drizzle migrations for `packages/core`.

## Working style
- Keep responses short; skip trailing "here's what I did" summaries unless asked.
- Explain non-obvious choices briefly as we go, since the point here is learning.
