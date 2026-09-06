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
- `src/i18n/` — `next-intl` wiring: `routing.ts` (locales/default locale/RTL set),
  `navigation.ts` (locale-aware `Link`/`redirect`/`usePathname`/`useRouter` — use these
  instead of `next/navigation` directly so locale prefixes stay correct), `request.ts`
  (server-side message loading, wired into `next.config.js` via `next-intl/plugin`).
- `src/proxy.ts` — Next 16 renamed the `middleware.ts` convention to `proxy.ts`; this is
  where `next-intl`'s locale-detection middleware runs. Its `matcher` explicitly excludes
  `/admin` (COM-24's dashboard) — never let that route get a locale prefix.

## i18n / RTL (COM-16)
- All routes live under `src/app/(site)/[locale]/` — a route group (`(site)`) wrapping the
  `[locale]` dynamic segment, specifically so `src/app/(admin)/admin/` (COM-24) can be a
  second, sibling **root layout** with its own `<html>`/`<body>` that never gets wrapped in
  `next-intl`'s provider or a locale prefix. Follow that same `(group)/route` pattern when
  adding COM-24 — don't nest `admin/` inside `[locale]/`.
- Locales: `ar` (default) and `en`, defined in `src/i18n/routing.ts`. `ar` is default
  because the audience is Arabic-first (see `docs/projects/groundtruth.md`) — `en` exists
  for internal/dev use, not end users.
- RTL: `LocaleLayout` (`src/app/(site)/[locale]/layout.tsx`) sets `<html dir="rtl">` for
  any locale in the `RTL_LOCALES` set (currently just `ar`) — check against that set, not a
  hardcoded `locale === 'ar'`, so adding another RTL locale later is one line.
- **Convention: all UI copy goes through `next-intl` message keys** (`useTranslations`/
  `getTranslations`, never a hardcoded string in JSX) — `messages/en.json` is the source of
  truth today. `messages/ar.json` currently mirrors the English text verbatim as a
  placeholder (see its `_comment` key) — the real Arabic translation pass is COM-25, not
  this issue. Don't let `ar.json`'s key structure drift from `en.json`'s between now and
  then.

## Data access
Uses `@committee/db` (`packages/db`) rather than talking to Postgres directly. See that
package's notes on the two exported clients (`db` for normal reads/writes, `pooledDb` for
future transactional writes) before adding a new query.

## Bundler quirk: workspace packages + NodeNext `.js` imports (COM-17)
`packages/db` and `packages/auth-providers` are consumed as raw TypeScript source
(`main`/`exports` point straight at `src/index.ts`, no build step — the same pattern
`packages/core` uses for `apps/cli`/`apps/digest`). Their own internal relative imports
use NodeNext-style `./foo.js` specifiers, which is *required* for `tsc`
(`moduleResolution: NodeNext`) and for `node --import tsx` (their `db:migrate`/test
scripts) to resolve them — but neither Turbopack nor plain webpack remaps `.js` to the
real `.ts` file for a workspace package's own internal imports by default. Turbopack
also showed genuinely nondeterministic "Module not found" errors across otherwise-
identical requests while debugging this (not just a one-time cold-start miss), so this
repo pins `apps/web`'s `dev`/`build` scripts to `next dev --webpack` / `next build
--webpack` rather than Turbopack (the Next 16 default) until Turbopack supports the
equivalent of webpack's `resolve.extensionAlias`. `next.config.js` sets both
`transpilePackages` (so these packages go through Next's own compiler instead of being
treated as opaque `node_modules`) and `webpack(config) { config.resolve.extensionAlias
= { '.js': ['.ts', '.tsx', '.js'] } }` (so the `.js` specifier actually resolves to the
`.ts` file). **If a route touching `@committee/db` or `@committee/auth-providers` 500s
with "Module not found: Can't resolve './something.js'"**, this is almost certainly
the same class of issue recurring — check that `transpilePackages` still lists the
package and that `--webpack` hasn't been dropped from the dev/build scripts, and don't
re-attempt Turbopack without adding an equivalent extension-remapping mechanism first.
This was invisible to `pnpm run typecheck`/`lint` (CI only runs those, not `next
build`) — it only surfaces by actually booting the dev server and hitting a route that
imports one of these packages, which is why every issue that touches a new
`@committee/db`/`@committee/auth-providers` import path should get an actual dev-server
smoke test, not just a clean typecheck.

## Auth, KYC & compliance (COM-18)
- `src/lib/auth/providers.ts` — module-level `otpProvider`/`kycProvider` singletons,
  currently `@committee/auth-providers`' mocks. This is the one place a real vendor
  adapter (once the founder picks one — see `docs/projects/groundtruth-vendor-spike.md`)
  gets swapped in; nothing else should import `@committee/auth-providers` directly.
- `src/lib/auth/otp-flow.ts` — `requestOtp`/`verifyOtp`. Registration and login are the
  same flow (a verified phone either matches an existing user or creates one) — no
  separate signup step. `MockOtpProvider`'s in-memory state is process-local, so this
  only works correctly as one long-lived server instance (local dev today); a real
  vendor adapter has no such constraint.
- `src/lib/auth/kyc-flow.ts` — `submitKyc`/`getLatestKycStatus`. The mock provider
  resolves to `'approved'` synchronously; a real vendor is async (webhook-driven), so
  `submitKyc`'s immediate status read is a stand-in for that, not the final design.
- `src/lib/auth/delete-account.ts` — data-deletion-rights: hard-deletes a user and
  everything tied to them via `pooledDb.transaction(...)`, not `db` — `otp_requests` has
  no FK to `users` (it's keyed by phone, written before a user row exists), so deleting
  both together needs a real multi-statement transaction. This is the first concrete use
  of the `pooledDb` split documented in `packages/db/CLAUDE.md`.
- `src/lib/storage/local-file-storage.ts` — KYC document/selfie uploads land on local
  disk under `apps/web/.data/uploads` (gitignored). **Not production storage** — replace
  with a real object storage vendor before deploying; see the `TODO(human)` in that file.
  Served back through `src/app/uploads/[filename]/route.ts`, gated behind any
  authenticated session (filenames are unguessable UUIDs, but that's not a substitute for
  real per-owner authorization).
- `src/app/api/_lib/session.ts` — cookie-backed session (HMAC-signed, see
  `src/lib/auth/session.ts` for the signing itself) plus `requireAdminSession()` for
  admin-only routes. `SESSION_SECRET` (`.env.example`) must be a real random value per
  environment. There's no self-serve path to the `'admin'` role — promoting a user is a
  manual DB update until an invite flow exists (intentionally out of MVP scope).
- Route handlers live at `src/app/api/**` — outside `[locale]` (API routes don't need
  i18n) but still sibling to `(site)`/`(admin)`, so this doesn't conflict with the
  route-group root-layout split described above.
- COM-17 (listings) depends on this: listing creation requires an authenticated seller
  with an **approved** KYC verification (not merely submitted) — never allow anonymous
  listing creation, that's the collusion vector the whole KYC/OTP stack exists to close
  (see `docs/projects/groundtruth.md`'s anti-collusion mechanism).

## Listings (COM-17)
- `src/lib/listings/validation.ts` — pure shape/range validation (`validateListingInput`),
  shared by the create-listing Server Action and the `/api/listings` route so both reject
  bad input the same way. `LISTING_TYPES` is the single source of truth for the
  `listingTypeEnum` values — keep it in sync with `packages/db/src/schema.ts` by hand
  (Drizzle's pg enum doesn't export its value list back out in a form worth importing).
- `src/lib/listings/listings.ts` — `createListing` calls `requireKycApprovedSeller` itself
  (not just at the route layer), so it's safe to call from anywhere, including a future
  admin tool, without re-deriving the gate. `listActiveListings` only ever returns
  `status: 'active'` rows — there's no seller dashboard yet for viewing/archiving your own
  listings regardless of status, that's a follow-up, not this issue's scope.
- Photos: `POST /api/listings/[id]/photos` (multipart) stores to the **public** upload
  bucket (`saveUploadedFile(..., 'public')`) and serves back through
  `src/app/photos/[filename]/route.ts` — no auth required to view, since browsing a
  listing never requires login. This is the opposite visibility of KYC uploads (COM-18),
  which use the **private** bucket and `src/app/uploads/[filename]/route.ts`. Getting
  these two buckets/routes crossed would either leak private KYC documents publicly or
  break public listing photo display — check `visibility` at every `saveUploadedFile`/
  `resolveUploadPath` call site if you touch either flow.
- Pages: `(site)/[locale]/listings` (browse, `force-dynamic` — see the bundler-quirk note
  above on why: no DB credentials at `next build` time in this repo),
  `(site)/[locale]/listings/[id]` (detail, same), `(site)/[locale]/listings/new`
  (create — a plain `<form action={serverAction}>`, no client JS). `(site)/[locale]/login`
  is a client component (two-step OTP: phone → code) since it needs to call
  `/api/auth/otp/*` interactively; everything else in this issue stays server-rendered.
- Known gap: validation/authorization errors from the create-listing Server Action
  currently surface via Next's default error boundary rather than an inline form
  message — a friendlier UX pass is a follow-up, not blocking for a first working,
  correctly-gated create flow.

## Negotiation state machine (COM-19)
- `src/lib/negotiations/state-machine.ts` — `applyNegotiationAction`, a pure function
  (no DB access) implementing the fixed offer/counter/accept/reject transitions from
  `docs/projects/groundtruth.md`'s anti-collusion mechanism. Unit-tested exhaustively
  in its sibling `.test.ts` since it has no Neon-driver dependency to work around.
- `src/lib/negotiations/negotiations.ts` — `startNegotiation`/`respondToNegotiation`
  wrap the pure state machine with real reads/writes, using `pooledDb.transaction(...)`
  with `.for('update')` row locks (not `db`) — packages/db/CLAUDE.md calls out offer
  state transitions by name as needing this, so two near-simultaneous actions (e.g.
  buyer accepts while seller counters) can't both apply against the same stale
  snapshot. One open negotiation per (listing, buyer) pair, enforced in application
  code inside the same transaction rather than a DB constraint.
- A negotiation's `sellerId` is denormalized from the listing at creation time. Buyers
  only need an authenticated session to open a negotiation — unlike sellers publishing
  listings (COM-17), COM-19 does not require buyer KYC approval.
- Routes: `POST /api/listings/[id]/negotiations` (open), `POST
  /api/negotiations/[id]/respond` (counter/accept/reject). Pages: the listing detail
  page grows a "make an offer" form for any authenticated non-owner; a new
  `(site)/[locale]/negotiations/[id]` page shows the event history and, when it's the
  viewer's turn, the accept/reject/counter forms — all server-rendered forms/Server
  Actions, no client JS, consistent with COM-17's pages.
- Validated: full migration + state-machine SQL sequence run directly against a local
  Postgres instance (see packages/db/CLAUDE.md); the actual `pooledDb`/`db` Neon
  clients still can't reach a local Postgres (same limitation noted under COM-18/17),
  so the app-level dev-server smoke test only covers routes that don't touch the DB.

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
