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

Not yet scaffolded on disk — planned to live at `apps/web` (+ `packages/db`) once COM-14
executes. Once scaffolded, give it its own `apps/web/CLAUDE.md` (same pattern as
`packages/core/CLAUDE.md`) for implementation-level detail; keep this file as the
product-level spec/audience/roadmap doc and trim any duplication once that split happens.
