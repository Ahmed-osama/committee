# Coding style

Cross-repo conventions. Package-specific detail belongs in that package's own
CLAUDE.md (e.g. `packages/core/CLAUDE.md`), not here — this file is for things
that should hold across `apps/*` and `packages/*`.

## TypeScript
- `strict: true` (see `tsconfig.base.json`), ES2022 target, NodeNext modules/resolution.
  Every package extends this base config rather than redefining compiler options.
- ESM only (`"type": "module"` everywhere) — no CommonJS `require`.
- Workspace packages import via their published name (`@committee/core`), never relative
  `../../packages/core/src/...` paths across a package boundary.
- No default exports for shared modules — named exports only, so imports are greppable
  and renames don't silently break call sites.

## Comments
- Reserved for *why*, not *what* — name the specific failure mode, constraint, or
  incident a piece of code exists to handle. If a comment just restates the code in
  English, delete it.
- No file-header or section-banner comments. No commented-out code.

## Testing
- `node --test` with `tsx`, colocated as `*.test.ts` next to the file under test —
  no separate `__tests__/` tree. See `packages/core/package.json`'s `test` script.
- Tests run against `COMMITTEE_DB_PATH=:memory:` — never against the real `committee.db`.

## Structure
- `apps/*` are deployable entry points (CLI, web app); `packages/*` are libraries with
  no direct entry point, consumed only via workspace imports.
- A package's internal layout and subsystem-specific conventions live in that package's
  own `CLAUDE.md`, not duplicated here.
