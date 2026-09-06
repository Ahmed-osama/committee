# GroundTruth

Real-estate marketplace for a small Nile Delta town in Egypt. Breaks local broker
collusion via direct seller/buyer negotiation and a game-resistant valuation signal
built from the platform's own verified deals.

Linear project: [`GroundTruth`](https://linear.app/committee/project/groundtruth-4db27ef01168)
— issues COM-14 through COM-36, filed under one Epic per [Linear conventions](../../CLAUDE.md#linear-conventions).
Finalized across 5 `committee_plan` rounds (2026-09-05/06) plus founder corrections after round 5.

## Core thesis

Local real-estate brokers collude to force unfair prices onto sellers and buyers who have
no independent way to check a fair price. GroundTruth lets sellers and buyers negotiate
directly, with a valuation signal derived from the platform's own real, closed, dual-
confirmed deals — never broker opinion — and structural defenses against the exact gaming
brokers would attempt (fake accounts, fabricated offers, fabricated deals).

## Audience — design constraint, not a checkbox

End users are typically farmers and older, less-educated residents of the town, not
tech-native younger people (who are largely uninvolved in local real estate here).
Every UI/flow decision should be checked against this:
- Arabic-first, RTL, via `next-intl` — not an English UI with a translation layer bolted on.
  English copy exists for internal/dev purposes only.
- Icon-first over text-first; voice notes over typed text wherever content is user-authored.
- Keep flows shallow — few steps, few decisions per screen, minimal simultaneous choices.
  Prefer one clear action per screen over a dense form. If a flow needs a tutorial to be
  usable, it's not simple enough yet.
- Avoid jargon (real-estate or tech) in copy; assume the reader may not read comfortably.
- For users who genuinely cannot use the app, a staffed phone fallback line exists — but
  using **only** canned, non-editable pre-recorded explainer audio, never an operator-
  authored message, so a human fallback can't become a broker-like pressure point (COM-35).

## Anti-collusion mechanism (the actual product)

This is what the platform is *for*, not an afterthought:
- **Dual-party deal confirmation** — a deal only becomes "closed" once both buyer and
  seller independently confirm it happened; neither side's unilateral claim counts.
- **Structured offer threads** — price offers/counters/accept/reject flow through a fixed
  state machine rather than free-text, producing clean data for the valuation engine and
  removing room for a broker to quietly steer the negotiation.
- **KYC + phone OTP** on every account, so the marketplace is provably populated by real,
  distinct people — not sockpuppets inflating demand or fabricating comparable deals.
- **Public anonymized deal feed** — real closed deals (zone/type/price, no identities)
  visible to anyone, no login required, so the platform's price data is checkable before
  a visitor ever signs up.
- **Valuation badge suppressed per-cell** until enough real dual-confirmed deals exist for
  that (zone, type, area-band) cell — no synthetic seed data, no badge until it's earned.
  A round-5 plan to seed valuations from Egyptian land-registry deeds was **discarded**
  once the founder ruled out ground operations for MVP; external data sourcing is deferred
  as a funded, post-traction enhancement instead.

## Key decisions, in order

1. **Round 1** — MVP scope (listings, negotiation, pay-to-reveal-contact) and the
   anti-collusion mechanism above.
2. **Round 2** — Next.js + Postgres/Drizzle stack; vendor-bought KYC/OTP/payments rather
   than building any of that in-house.
3. **Round 3** — full screen-by-screen UX; "promise once, receipt once" trust-signal rule
   (every commitment the product makes to a user is shown once, plainly, not repeated as
   nagging confirmation).
4. **Round 4** — mobile (React Native) deferred entirely out of MVP scope: `apps/web` +
   `packages/db` only, no premature package extraction. Dual-confirmation deal-closure
   was originally going to be its own deployable service (to isolate `SELECT ... FOR
   UPDATE` lock contention from frontend traffic) — reversed back into the monolith once
   zero-ops became a stated goal (COM-20, gate tracked at COM-28). Shared-package
   extraction (`packages/domain`, `packages/schema`, `packages/api-client`) happens as a
   dedicated sprint the day mobile work actually starts, not before (tripwire: COM-26).
5. **Round 5 (superseded)** — see valuation seeding note above.
6. **Post-round-5 corrections** — Stripe ruled out (unusable for an Egypt-based business
   without a foreign entity, confirmed via research); swapped to **Paymob**. Confirmed
   Arabic-first/RTL via `next-intl`, not an in-house i18n tool.

Legal/liability review (valuation-publishing liability, real-money-deal facilitation, KYC
data retention, entity structure) was explicitly deferred as a fast-follow rather than an
MVP blocker — founder's choice, tracked as a gate (COM-27): revisit before real users
transact real money, not before Task 1 starts.

## Stack

Next.js App Router + Postgres/Drizzle, Vercel + Neon, Paymob for payments, `next-intl`
for i18n/RTL.

## Engineering roadmap (Linear issues COM-14–COM-28)

Build order, roughly sequential:

| Issue | What | Priority |
|---|---|---|
| COM-14 | Repo/infra foundation: `apps/web` + `packages/db`, Neon + Vercel wiring | Urgent |
| COM-15 | Vendor spike: confirm KYC + OTP actually support Egyptian IDs/numbers | Urgent |
| COM-16 | Arabic/English i18n foundation (`next-intl`) + RTL layout primitives | High |
| COM-17 | Listings, photo upload, browsing/detail pages | Urgent |
| COM-18 | Auth, KYC & compliance infrastructure (OTP registration, doc/selfie KYC, admin role gating, data-deletion rights) | Urgent |
| COM-19 | Structured offer & negotiation thread state machine | Urgent |
| COM-20 | Dual-confirmed deal closure, in-monolith transaction | High |
| COM-21 | Pay-to-reveal paywall & credit ledger (Paymob) | Urgent |
| COM-22 | Public anonymized deal feed | High |
| COM-23 | Valuation engine — organic on-platform data only, suppressed until populated | High |
| COM-24 | Admin anti-gaming & moderation dashboard (unlocalized, `/admin` outside `[locale]`) | Medium |
| COM-25 | Arabic UI copy pass (every `next-intl` key translated, admin dashboard excluded) | Medium |
| COM-26 | **Gate** — mobile app + shared-package extraction (tripwire, not work) | Low |
| COM-27 | **Gate** — legal/liability review (fast-follow, before real money moves) | Medium |
| COM-28 | **Gate** — split dual-confirmation into its own service (deferred, revisit under load) | Low |

## Go-to-market plan (Linear issues COM-29–COM-36)

Ground-floor, one-founder, one-micro-zone rollout — deliberately manual before the
product's network effects (the deal feed) can do the selling:

1. **COM-29 — Phase 0** (weeks 1-2): lock one micro-zone (500-1500 households) with
   ≥5 pre-existing founder contacts, ≥10 visible "for sale" signals, not the town's
   broker-dominated commercial core. Output: 20 named prospective sellers.
2. **COM-30 — Phase 0b** (weeks 1-2, parallel): secure 2 respected local "trust anchors"
   (elder, religious leader, or long-standing business owner) via an in-person ask, to be
   physically present at the first 3 signings/viewings.
3. **COM-31 — Phase 0.5** (weeks 2-4): Deal Scout runs single-sitting witnessed listings —
   scout + seller + one mutual contact, video walkthrough, structured listing form, signed
   paper agreement, no second visit. Target: ≥10 live listings by Day 21.
4. **COM-32 — Phase 0.5b** (weeks 2-4, parallel): source 25 named buyer prospects directly
   from each seller's own network ("who in your network has been looking to buy?") rather
   than waiting for buyers to discover the platform.
5. **COM-33 — Phase 0.5c** (weeks 3-5): founder personally facilitates introductions and
   physical viewings for matched pairs; platform's negotiation flow is the documentation
   layer, not the discovery layer. Target: 5 confirmed dual-sided deals by Day 45.
6. **COM-34 — Phase 1** (weeks 6-8): expand to 2 adjacent micro-zones once the deal feed
   is populated (5+ deals) — the pitch becomes "5 verified deals already recorded for
   [zone] — see the anonymized feed," letting the feed do work the founder previously did
   in person.
7. **COM-35** — assisted-mode session logging + staffed phone fallback (see Audience above).
8. **COM-36 — gate** before rollout past the first 2 zones: moderated in-town usability/
   accessibility testing with real target-demographic users (not internal team members) —
   the low-literacy/older-user UX patterns are committee-debated design decisions, not yet
   validated against real users.

## Status

COM-14 executed: `apps/web` (Next.js App Router) and `packages/db` (Drizzle, wired for
Neon's pooled + unpooled connection strings) now exist on disk, with their own
`CLAUDE.md`s (`apps/web/CLAUDE.md`, `packages/db/CLAUDE.md`) for implementation-level
detail — this file stays the product-level spec/audience/roadmap doc. No live Neon project
or Vercel deployment exists yet; `apps/web/README.md` documents the manual provisioning
steps a human still needs to do. The one generated migration (placeholder `users` table)
has not been applied to any database.

COM-15 done: vendor spike written up at `docs/projects/groundtruth-vendor-spike.md`
(Sumsub lead for KYC, Twilio Verify lead for OTP — both unconfirmed research
recommendations, founder decides before any contract/API keys). `packages/auth-providers`
defines the vendor-agnostic `KycProvider`/`OtpProvider` interfaces plus mock
implementations that COM-18 codes against regardless of which vendor is finally chosen.

COM-16 done: `next-intl` wired into `apps/web` — locale routing under
`src/app/(site)/[locale]/` (`ar` default/RTL, `en` for dev), `src/proxy.ts` for locale
detection (Next 16's `middleware.ts` → `proxy.ts` rename), `dir="rtl"` driven off an
`RTL_LOCALES` set. `messages/en.json` is the source of truth; `messages/ar.json` mirrors
it verbatim as a placeholder pending COM-25's real translation pass. The `(site)` route
group exists specifically so COM-24's `/admin` can be a sibling unlocalized root layout
later — see `apps/web/CLAUDE.md`.

COM-18 done: phone OTP registration/login (`/api/auth/otp/{send,verify}`), KYC doc/selfie
submission (`/api/kyc/submit`, stored on local disk pending a real object-storage vendor —
verification itself is stubbed via `@committee/auth-providers`'s mock, not a real KYC
vendor call), a signed session cookie, admin role gating (`role` column +
`requireAdminSession()`), and data-deletion rights (`/api/account/delete`, hard-deletes a
user via `pooledDb.transaction(...)` — the first real use of the pooled-client split
`packages/db/CLAUDE.md` documents). Schema + migration validated against a local Postgres
instance (insert/cascade-delete exercised directly); the Neon serverless HTTP driver
itself still needs a real Neon endpoint or local proxy to fully exercise, consistent with
what `apps/web/README.md` already notes about local-Postgres fallback. See
`apps/web/CLAUDE.md`'s "Auth, KYC & compliance" section for the full breakdown.

COM-17 done: listing creation (`POST /api/listings` + `(site)/[locale]/listings/new`,
gated on an authenticated seller with an **approved** KYC verification, not merely
submitted), photo upload (public bucket, `/api/listings/[id]/photos`), and public
browse/detail pages (`(site)/[locale]/listings`, `.../listings/[id]` — no login
required). A minimal client-side login page (`(site)/[locale]/login`, two-step OTP)
was also added since it's needed to exercise the create flow at all. Found and fixed a
real bundler bug along the way: neither Turbopack nor webpack remapped
`packages/db`/`packages/auth-providers`'s NodeNext-style `./foo.js` internal imports to
their real `.ts` files by default, so any route touching those packages 500'd with
"Module not found" — invisible to `pnpm run typecheck`/`lint` (CI doesn't run `next
build`), only caught by actually booting the dev server. Fixed via `transpilePackages`
+ a webpack `resolve.extensionAlias`, with `apps/web` now pinned to `next dev/build
--webpack` since Turbopack (Next 16's default) has no equivalent option and was also
nondeterministic while debugging this — see `apps/web/CLAUDE.md`'s "Bundler quirk"
section, which flags this as a recurring-risk area for any future issue that adds a new
`@committee/db`/`@committee/auth-providers` import path. Schema/migration validated
against local Postgres directly; full request-level exercise against a real Postgres
still blocked on the same Neon-serverless-driver-needs-a-real-endpoint limitation noted
under COM-18. Next up per the roadmap: COM-19 (offer/negotiation state machine).

COM-19 done: structured offer/counter/accept/reject negotiation state machine.
`apps/web/src/lib/negotiations/state-machine.ts` is a pure, exhaustively unit-tested
transition function; `negotiations.ts` wraps it with `pooledDb.transaction(...)` +
`.for('update')` row locks (per `packages/db/CLAUDE.md`'s note that offer state
transitions need the pooled client, same as COM-20). One open negotiation per
(listing, buyer) pair. Buyers only need to be authenticated, not KYC-approved (that
gate stays specific to sellers per COM-17/18). New routes/pages: `POST
/api/listings/[id]/negotiations`, `POST /api/negotiations/[id]/respond`, and a
`(site)/[locale]/negotiations/[id]` thread page. See `apps/web/CLAUDE.md`'s
"Negotiation state machine" section for the full breakdown, including how this was
validated (migration + full state-machine SQL sequence run directly against local
Postgres — the Neon-driver-needs-a-real-endpoint limitation from COM-17/18 still
applies to `pooledDb`/`db` themselves). Next up: COM-20 (dual-confirmed deal closure).

COM-20 done: dual-confirmed deal closure. A `deals` row (`'pending'` status, unique
`negotiationId`) is created automatically the moment a negotiation (COM-19) is
accepted, in the same transaction as the acceptance. `apps/web/src/lib/deals/
confirmation.ts` is a pure, exhaustively unit-tested merge function (deal flips to
`'closed'` only once both `buyerConfirmedAt`/`sellerConfirmedAt` are set, idempotent
on repeat confirmation); `deals.ts` wraps it with `pooledDb.transaction(...)` +
`.for('update')`, same lost-update reasoning as COM-19. See `apps/web/CLAUDE.md`'s
"Dual-confirmed deal closure" section, including the known gap that a closed deal
doesn't yet auto-archive its listing. Next up: COM-21 (pay-to-reveal paywall).

COM-21 done: pay-to-reveal paywall + credit ledger. New `packages/payment-providers`
(mirrors `auth-providers`'s vendor-agnostic-interface pattern) defines
`PaymentProvider` + `MockPaymentProvider` for Paymob (confirmed vendor, no real
account/credentials yet). Credits are a `SUM`-of-ledger balance, never a mutable
counter; a purchase only grants credits once a webhook reports success, guarded
against double-crediting on webhook retries via `pooledDb.transaction(...)` +
`.for('update')`. Revealing a listing's seller phone costs a flat
`REVEAL_COST_CREDITS`, guarded against double-charging by a unique
`(listingId, buyerId)` index. A dev-only mock checkout page stands in for Paymob's
real hosted checkout and must be deleted once a real adapter lands — see
`apps/web/CLAUDE.md`'s "Pay-to-reveal paywall & credit ledger" section for the full
breakdown. Next up: COM-22 (public anonymized deal feed).

COM-22 done: public anonymized deal feed. `(site)/[locale]/deals` lists real
`'closed'` deals (COM-20) — zone/type/price only, no session required, linked from
the homepage. `lib/deals/feed.ts` explicitly selects only those anonymized columns
rather than the whole `deals` row, so a future identity-bearing column can't leak
into it by accident. See `apps/web/CLAUDE.md`'s "Public anonymized deal feed"
section. Next up: COM-23 (valuation engine).

COM-23 done: valuation engine. `computeValuationCells` (pure, exhaustively
unit-tested) aggregates real `'closed'` deals into `(zone, propertyType, areaBand)`
cells, but a cell is only ever returned once it has `MIN_DEALS_FOR_VALUATION` (3,
placeholder) real deals — suppressed entirely (absent, not a placeholder) below that,
and never seeded with synthetic data, per this doc's anti-collusion mechanism. Shown
on the listing detail page as an average EGP/sqm figure + deal count when a match
exists for that listing's own cell. See `apps/web/CLAUDE.md`'s "Valuation engine"
section. Next up: COM-24 (admin anti-gaming/moderation dashboard).

COM-26/COM-27/COM-28 remain pending gates (mobile + shared-package extraction, legal/
liability review, splitting dual-confirmation into its own service) — not attempted here,
tracked as tripwires per the roadmap table above.
