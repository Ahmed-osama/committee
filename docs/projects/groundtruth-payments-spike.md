# COM-55: M0 payments spike findings

Status of the three concrete asks in COM-55, as of 2026-09-14.

## 1. Concurrent-authorization dedup behavior — blocked, not run

COM-55 asks to fire two Paymob Intention API calls with the same `merchant_order_id`
while the first is in-flight and document what Paymob actually does. This needs a real
Paymob sandbox/test account (API key + integration IDs); none exists yet in this repo
(same blocker COM-54 already flagged for all real-money milestones — merchant
onboarding is COM-56, a separate compliance-track issue). **Not run.** Do not assume
Paymob dedupes correctly on its own — this is exactly why COM-54's binding design
treats the DB-level unique constraint as the _authoritative_ guard regardless of
Paymob's behavior, which is what this spike actually delivered (see §3).

## 2. Wallet trigger mechanism — documented, not sandbox-verified

Public Paymob docs/integration guides (not a real account, no first-party
confirmation) describe the mobile-wallet flow as: the merchant backend calls a
pay-with-wallet endpoint with `source.subtype: "WALLET"` and the customer's wallet
phone number; the response carries a redirect/iframe URL to a **Paymob-hosted web
page** (not a native-app deep link) where the customer enters their wallet PIN, then
an OTP sent by the wallet operator (SMS/USSD to their phone). Third-party
integrations report Vodafone Cash test flows using this same phone+PIN+OTP shape.

This is consistent with what COM-54 needs (server-initiated, no dependency on the
customer having a specific wallet's native app installed) but **is not verified
against a real sandbox** — no account exists to confirm the exact response shape,
timing, or whether all four target wallets (Vodafone Cash, Orange Cash, Etisalat
Cash, We Pay) behave identically. Re-verify this against real sandbox credentials
once COM-56 (merchant onboarding) provides them, before M1 implementation begins.

## 3. DB-level idempotency guard — built

Built unconditionally, per COM-55's explicit instruction to not depend on whatever
the spike found (or, here, couldn't find) about Paymob's own dedup behavior:

- `packages/db/src/schema.ts` — `payment_orders` (unique `merchant_order_id`) and
  `late_settlement_reconciliations` (see `packages/db/CLAUDE.md`).
- `apps/web/src/lib/payments/payment-order-state-machine.ts` — pure state machine
  (`pending_authorization` → `awaiting_webhook_confirmation` → `confirmed` |
  `refunded_timeout`), unit-tested exhaustively including the late-webhook-after-
  timeout case.
- `apps/web/src/lib/payments/orders.ts` — DB-backed wrapper. `createPaymentOrder`
  uses `onConflictDoNothing` on `merchant_order_id` + a re-select, so two racing
  callers for the same order both get back the same single row rather than one
  erroring — this is the actual mechanism verified, since it relies on Postgres's own
  unique-index locking, not on anything Paymob-specific.

## Scope not attempted

No checkout-creation or webhook-handling route was wired up — that requires a real
`PaymobPaymentProvider` adapter (`packages/payment-providers`), which needs the same
real credentials blocking §1. That's M1 (COM-57), gated on COM-56. This spike only
had to prove the idempotency mechanism works and land the schema it depends on.
