# apps/_template

Baseline scaffold for a new app in this monorepo — copy this directory to bootstrap a new
mini-startup app rather than reinventing the package.json/tsconfig wiring each time.

## Instantiate a new app

1. `cp -r apps/_template apps/<name>`
2. In `apps/<name>/package.json`, rename `"name"` to `@committee/<name>`.
3. Replace `apps/<name>/src/index.ts` with the app's real entry logic, importing shared
   code from `@committee/core` as needed.
4. `pnpm install` (picks up the new workspace package — `apps/*` is already globbed in
   `pnpm-workspace.yaml`).
5. `pnpm --filter @committee/<name> start` to run it, `pnpm run typecheck` to typecheck
   it alongside everything else.

No `test` script is included — add one only once the app actually has tests; Turbo's
`test` task simply skips packages without one.

This template is the baseline the "second mini-startup app" (Linear COM-10) gets
bootstrapped from, to prove out — or disprove — which parts of `packages/core` are
actually reusable before anything gets extracted speculatively.
