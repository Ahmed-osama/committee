# apps/web

Next.js App Router deployable for GroundTruth. See `docs/projects/groundtruth.md` for
product spec/audience/roadmap; this file is implementation-level detail for this app only.

## Layout
- `src/app/` — routes, layouts, Server Components. Next.js request/render context
  (`next/headers`, `next/cookies`, `next/navigation`) is only allowed here.
- `src/lib/` — domain logic: business rules, data access, anything that should stay
  testable outside a request/response cycle. `next/headers`, `next/cookies`, and
  `next/navigation` imports are blocked here by the `no-restricted-imports` rule in
  `eslint.config.js` — route handlers/Server Components read those APIs and pass plain
  values into `src/lib` functions, not the other way around.

## Data access
Uses `@committee/db` (`packages/db`) rather than talking to Postgres directly. See that
package's notes on the two exported clients (`db` for normal reads/writes, `pooledDb` for
future transactional writes) before adding a new query.

## Conventions specific to this app
- `next.config.js` sets `agentRules: false` — Next 16's `next dev` otherwise
  auto-generates/overwrites `AGENTS.md`/`CLAUDE.md` in this directory on every run, which
  fights with this repo's own hand-maintained CLAUDE.md hierarchy (root CLAUDE.md's
  "Docs map"). Don't remove that flag to "fix" a missing AGENTS.md.
- `typescript` is pinned to `^6.0.3` here, not the `^7.0.2` used elsewhere in the repo —
  `typescript-eslint` (pulled in via `eslint-config-next`) doesn't yet support TypeScript
  7.0. `tsc --noEmit` doesn't need any TS7-only feature here, so this is a lint-tooling
  constraint, not a language-version one. Revisit once typescript-eslint supports TS 7.
- `eslint` is pinned to `^9.39.5`, not the ESLint 10 line — `typescript-eslint@8.69.0`
  (again, via `eslint-config-next`) throws (`scopeManager.addGlobals is not a function`)
  under ESLint 10. Revisit once that combination is fixed upstream.
- `eslint.config.js` imports `eslint-config-next/core-web-vitals`'s flat config array
  directly rather than going through `@eslint/eslintrc`'s `FlatCompat` — this version of
  `eslint-config-next` already ships native flat config, and running it through the legacy
  `FlatCompat` shim throws (`Converting circular structure to JSON`) on `eslint-plugin-react`'s
  self-referencing flat config.
