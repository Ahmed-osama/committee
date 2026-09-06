# packages/payment-providers

Vendor-agnostic payment interface for GroundTruth's pay-to-reveal paywall (COM-21).
Exists so COM-21's credit-purchase flow never imports a vendor SDK directly — Paymob is
the confirmed vendor (see `docs/projects/groundtruth.md`'s post-round-5 corrections:
Stripe was ruled out for an Egypt-based business without a foreign entity), but no real
Paymob account/credentials exist yet.

## Layout
- `src/payment.ts` — the `PaymentProvider` interface, no implementation.
- `src/mock.ts` — `MockPaymentProvider`, used by `apps/web` and tests until a real
  Paymob adapter is wired up. Its `checkoutUrl` points at `apps/web`'s own dev-only
  "simulate payment" page rather than a real hosted checkout. Webhook payloads are
  signed/verified with a fixed dev-only HMAC secret (`signWebhookPayload`, not part of
  the `PaymentProvider` interface — a real vendor signs on their own server, never
  this app) so the signature-verification code path is genuinely exercised rather
  than always trusted.

## Conventions
- A real vendor adapter (`src/paymob.ts`) implements `PaymentProvider` as a new
  sibling file, not a change to the interface — same pattern as
  `packages/auth-providers`.
- Don't put vendor credentials or SDK calls here directly without also updating
  `.env.example` with placeholder-only values and a TODO comment on what a human must
  provision.
