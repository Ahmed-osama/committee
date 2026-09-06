# apps/web

GroundTruth's Next.js App Router frontend. See `docs/projects/groundtruth.md` for the
product spec and `./CLAUDE.md` for implementation notes (domain-logic convention, why
this app pins its own `typescript`/`eslint` versions).

## Local setup

From the repo root:

```
pnpm install
cp .env.example .env   # fill in DATABASE_URL / DATABASE_URL_UNPOOLED, see below
pnpm db:generate        # regenerate packages/db/migrations after a schema change
pnpm db:migrate         # apply migrations (needs a real Postgres — see provisioning below)
pnpm --filter @committee/web dev
```

`pnpm dev` boots at http://localhost:3000 and renders a placeholder page — no database
connection is required just to boot the app; `DATABASE_URL`/`DATABASE_URL_UNPOOLED` are
only needed once a route actually queries `@committee/db`.

## Provisioning Neon + Vercel (manual, one-time)

This repo has no Neon or Vercel credentials and does not provision either automatically.
A human needs to do the following once:

1. **Neon**: create a project (e.g. `groundtruth`), then create a **dev branch** off its
   main branch — don't run migrations against the main/production branch directly.
2. From that dev branch's connection details, copy both connection strings into `.env`:
   - the **pooled** one (has `-pooler` in the hostname) → `DATABASE_URL`
   - the **direct/unpooled** one → `DATABASE_URL_UNPOOLED`
3. **Vercel**: connect this repo as a Vercel project, with the project's root directory
   set to `apps/web` (this is a monorepo — Vercel needs to be told which app to deploy).
4. In the Vercel dashboard, set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` as environment
   variables (same values as step 2, or a separate Neon branch per Vercel environment if
   you want preview deploys isolated from dev).
5. Run `pnpm db:migrate` once (locally, pointed at the new dev branch, or as a Vercel
   deploy step) to apply `packages/db/migrations/` before the app depends on the `users`
   table existing.

No migration in this repo has been applied to any live database — `packages/db/migrations/`
currently contains one generated-but-unapplied migration (the placeholder `users` table).

## Local dev without Neon reachability (optional)

If you can't reach Neon (offline, firewalled), run a local Postgres instead via Docker
Compose. This isn't checked into the repo since it's a personal fallback, not something
CI or deploys use — create it yourself if needed:

```yaml
# docker-compose.yml (not committed)
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: committee
      POSTGRES_PASSWORD: committee
      POSTGRES_DB: committee
    ports:
      - '5432:5432'
```

Then point both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` at
`postgres://committee:committee@localhost:5432/committee` (a local Postgres has no
pgbouncer, so the same URL works for both). Note `packages/db/src/client.ts` uses Neon's
serverless drivers (`@neondatabase/serverless`) even for `db`/`pooledDb` — those speak
Postgres wire protocol fine against a local Postgres, but this path isn't exercised in CI
or documented further than "it should work"; Neon's dev branch is the supported path.

## Deferred: shared packages

`packages/domain`, `packages/schema`, and `packages/api-client` do not exist yet and are
**deliberately deferred** until a second (mobile) frontend actually starts — see root
CLAUDE.md's "Direction" and `docs/projects/groundtruth.md`'s round-4 decision (tripwire:
Linear issue COM-26). Don't pre-extract shared code out of `apps/web`/`packages/db` in
anticipation of that; add it as its own sprint when mobile work begins.
