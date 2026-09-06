# apps/web/src/lib

Domain-logic home for `apps/web`: business rules, data access, and anything that
should stay testable without a request/response cycle. Code here must not import
`next/headers`, `next/cookies`, or `next/navigation` — those tie a module to a
specific Next.js request/render context, which this layer is meant to be free of.
Route handlers and Server Components read those APIs and pass plain values in.

Enforced by the `no-restricted-imports` rule scoped to `src/lib/**` in
`eslint.config.js`.
