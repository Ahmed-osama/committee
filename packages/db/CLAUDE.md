# packages/db

Drizzle/Postgres client for GroundTruth, wired to Neon. Consumed as `@committee/db`.

## Layout
- `src/schema.ts` — Drizzle table definitions. `users` is currently a placeholder proving
  the migration pipeline works; real auth/KYC fields land with COM-18.
- `src/client.ts` — exports two clients, both built off `DATABASE_URL` (the pooled,
  pgbouncer-fronted connection string):
  - `db` (`drizzle-orm/neon-http`) — the default for normal reads/writes. One query per
    HTTP round trip; **no multi-statement transactions** (`db.transaction(...)` throws).
    Don't assume transactional writes on this client — see COM-18.
  - `pooledDb` (`drizzle-orm/neon-serverless`, TCP/WebSocket pool) — for write paths that
    need to hold a lock across statements (`SELECT ... FOR UPDATE`), e.g. COM-20's
    dual-confirmed deal closure and offer state transitions. Use this one, not `db`, for
    anything transactional.
- `src/migrate.ts` — runs migrations against `DATABASE_URL_UNPOOLED` (never `DATABASE_URL`
  — pgbouncer's pooling breaks Drizzle's migration locking). Invoked by `pnpm db:migrate`.
- `drizzle.config.ts` — also reads `DATABASE_URL_UNPOOLED`, so `pnpm db:generate` needs it
  set even though generation itself never opens a connection.
- `migrations/` — generated SQL + Drizzle's snapshot metadata. Never hand-edit; regenerate
  via `pnpm db:generate` after changing `schema.ts`.

## Conventions
- Don't add a query helper that opens its own connection — always go through `db` or
  `pooledDb` from `client.ts`, so there's exactly one place that knows the connection
  strings and driver choice.
