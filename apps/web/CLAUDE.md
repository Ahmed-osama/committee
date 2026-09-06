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
