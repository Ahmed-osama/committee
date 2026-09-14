import { integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

// 'operator' (COM-35) is deliberately a plain role value, not a separate table —
// it's an account like any other (still phone-OTP-verified), just with a role that
// unlocks the read-only (operator) route group instead of write access. This mirrors
// how 'admin' already works: no self-serve path to either role, a manual DB update
// until an invite flow exists (see requireAdminSession()'s doc comment).
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'operator']);

// Real/distinct-person gating for the anti-collusion mechanism (see
// docs/projects/groundtruth.md) — every account is phone-OTP-verified (COM-18) and
// `role` backs the admin gate for COM-24's moderation dashboard.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').notNull().unique(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per OTP send, keyed by the OtpProvider's own requestId (see
// packages/auth-providers) so verifyOtp can look up which phone a code was sent to
// without trusting the client to resubmit it. `consumedAt` prevents replaying the
// same requestId after a successful verification.
export const otpRequests = pgTable('otp_requests', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
});

export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'approved', 'rejected']);

// One row per KYC submission. `documentUrl`/`selfieUrl` point at wherever the upload
// flow stored the files (see apps/web/src/lib/storage) — this table never stores file
// bytes. `providerVerificationId` is the KycProvider's own id (packages/auth-providers)
// for correlating with a real vendor's dashboard once one is wired up.
export const kycVerifications = pgTable('kyc_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  documentUrl: text('document_url').notNull(),
  selfieUrl: text('selfie_url').notNull(),
  nationalIdNumber: text('national_id_number').notNull(),
  providerVerificationId: text('provider_verification_id').notNull(),
  status: kycStatusEnum('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const listingTypeEnum = pgEnum('listing_type', ['apartment', 'house', 'land', 'commercial']);
export const listingStatusEnum = pgEnum('listing_status', ['active', 'archived']);

// `zone` is a free-text micro-zone label for now (matches the founder's manual,
// one-micro-zone-at-a-time rollout — see docs/projects/groundtruth.md's go-to-market
// plan) rather than a geocoded region; a real zone taxonomy is a later enhancement.
// `priceEgp`/`areaSqm` are plain integers (whole EGP / whole square meters) —
// sufficient precision for MVP listings, avoids numeric-as-string friction in Drizzle.
export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  zone: text('zone').notNull(),
  propertyType: listingTypeEnum('property_type').notNull(),
  areaSqm: integer('area_sqm').notNull(),
  priceEgp: integer('price_egp').notNull(),
  status: listingStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const listingPhotos = pgTable('listing_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const negotiationStatusEnum = pgEnum('negotiation_status', ['open', 'accepted', 'rejected']);
export const negotiationTurnEnum = pgEnum('negotiation_turn', ['buyer', 'seller']);

// One negotiation thread per (listing, buyer) pair — see COM-19's fixed
// offer/counter/accept/reject state machine (docs/projects/groundtruth.md's
// anti-collusion mechanism: this replaces free-text negotiation entirely, so the
// valuation engine (COM-23) only ever sees structured, non-gameable data).
// `currentPriceEgp` is always the most recently proposed price (buyer's initial offer,
// or whoever's latest counter); `turn` says whose move it is next. Both are terminal
// once `status` leaves 'open' — sellerId is denormalized from the listing at creation
// time so a negotiation's parties stay fixed even if listing ownership rules ever change.
export const negotiations = pgTable('negotiations', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: negotiationStatusEnum('status').notNull().default('open'),
  currentPriceEgp: integer('current_price_egp').notNull(),
  turn: negotiationTurnEnum('turn').notNull().default('seller'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const negotiationEventTypeEnum = pgEnum('negotiation_event_type', [
  'offer',
  'counter',
  'accept',
  'reject',
]);

// Append-only audit trail of every state transition — never mutated or deleted, so a
// disputed negotiation always has a full, ordered record of who proposed what and when.
export const negotiationEvents = pgTable('negotiation_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  negotiationId: uuid('negotiation_id')
    .notNull()
    .references(() => negotiations.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: negotiationEventTypeEnum('type').notNull(),
  // Set for 'offer'/'counter'/'accept' (accept locks in the price at acceptance time);
  // null for 'reject'.
  priceEgp: integer('price_egp'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dealStatusEnum = pgEnum('deal_status', ['pending', 'closed']);

// COM-20's anti-collusion core: a deal only becomes 'closed' once BOTH
// buyerConfirmedAt and sellerConfirmedAt are set, independently, by each party —
// neither side's unilateral claim counts (docs/projects/groundtruth.md). Created
// automatically the moment a negotiation (COM-19) is accepted, in 'pending' status;
// `negotiationId` is unique because a negotiation can be accepted at most once. Only
// a 'closed' deal is eligible for COM-22's public feed / COM-23's valuation engine.
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  negotiationId: uuid('negotiation_id')
    .notNull()
    .unique()
    .references(() => negotiations.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agreedPriceEgp: integer('agreed_price_egp').notNull(),
  status: dealStatusEnum('status').notNull().default('pending'),
  buyerConfirmedAt: timestamp('buyer_confirmed_at', { withTimezone: true }),
  sellerConfirmedAt: timestamp('seller_confirmed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creditPurchaseStatusEnum = pgEnum('credit_purchase_status', [
  'pending',
  'completed',
  'failed',
]);

// One row per Paymob (or mock, pending COM-15's vendor pick — see
// packages/payment-providers) checkout attempt. `providerReference` is unique so the
// webhook handler (apps/web/src/lib/payments/credits.ts) can look up which purchase a
// webhook event belongs to, and idempotently no-op a retried webhook delivery once
// `status` has left 'pending'. Credits are only added to the ledger below once a
// purchase reaches 'completed' — never optimistically at checkout-creation time.
export const creditPurchases = pgTable('credit_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerReference: text('provider_reference').notNull().unique(),
  packageId: text('package_id').notNull(),
  credits: integer('credits').notNull(),
  priceEgp: integer('price_egp').notNull(),
  status: creditPurchaseStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creditLedgerReasonEnum = pgEnum('credit_ledger_reason', ['purchase', 'reveal']);

// Append-only, source-of-truth ledger — a user's credit balance is always
// SUM(amount), never a mutable counter column, so it can never drift out of sync with
// what was actually purchased/spent. `referenceId` points at the `creditPurchases.id`
// for a 'purchase' row or the revealed `listings.id` for a 'reveal' row.
export const creditLedgerEntries = pgTable('credit_ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  reason: creditLedgerReasonEnum('reason').notNull(),
  referenceId: text('reference_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// COM-35's canned-script constraint, enforced structurally: this is a fixed, seeded
// set of pre-approved scripts an operator can "play" to a caller — there is
// deliberately no free-text field anywhere in the operator UI, so the only way to
// reference operator speech at all is by `id` from this table. Seed data lives in a
// migration, not application code, so the set can't be silently extended by a code
// change that skips review.
export const cannedScripts = pgTable('canned_scripts', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  body: text('body').notNull(),
});

export const assistedChannelEnum = pgEnum('assisted_channel', [
  'scout_witnessed',
  'phone_operator',
]);

// Append-only audit trail for every assisted-mode interaction (COM-35). This table is
// the actual acceptance criterion, not a nice-to-have: it exists so a human-assisted
// action is always attributable to a specific operator, script, and moment, even
// though — per COM-19/COM-20 — the row itself never grants the operator any power to
// complete a negotiation or deal confirmation on the user's behalf.
export const assistedSessionLogs = pgTable('assisted_session_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Cascade, matching every other FK to `users` here — this repo hard-deletes a
  // user and everything tied to them for data-deletion rights (see
  // apps/web/src/lib/auth/delete-account.ts); an operator's own deletion request
  // must not be silently blocked by their past audit entries.
  operatorId: uuid('operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  channel: assistedChannelEnum('channel').notNull(),
  scriptId: text('script_id').references(() => cannedScripts.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per (listing, buyer) — the pay-to-reveal paywall's gate. A unique
// constraint on the pair means a buyer is only ever charged once per listing;
// revisiting an already-revealed listing re-reads this row instead of re-charging.
export const contactReveals = pgTable(
  'contact_reveals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    creditsSpent: integer('credits_spent').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.listingId, table.buyerId)],
);

export const paymentOrderStatusEnum = pgEnum('payment_order_status', [
  'pending_authorization',
  'awaiting_webhook_confirmation',
  'confirmed',
  'refunded_timeout',
]);

// COM-54/COM-55's buyer-to-seller phone-payment order (distinct from
// `creditPurchases` above, which is the seller/buyer paying the *platform* for a
// reveal — this is a buyer paying a seller directly for a deal/deposit). One row per
// payment attempt, tied to the `deals` row it's paying against.
//
// `merchantOrderId` is the authoritative idempotency guard, unconditionally, per
// COM-55: the DB-level unique constraint (not Paymob's own dedup behavior, which
// COM-55's sandbox spike found undocumented/unverified — see
// docs/projects/groundtruth-payments-spike.md) is what actually prevents two
// concurrent authorization attempts for the same order from both succeeding.
// `orders.ts`'s `createPaymentOrder` inserts and treats a unique-violation on this
// column as "already in flight," never as an error to surface to the caller.
//
// State machine (binding design from COM-54's committee_plan round, id c56d2dbc):
// pending_authorization -> awaiting_webhook_confirmation (a 30-minute window,
// `authorizationDeadlineAt`, during which the UI shows a non-reactive "processing"
// state and re-tapping pay is not possible) -> confirmed | refunded_timeout. A
// webhook that arrives after refunded_timeout must never mutate this row — see
// `lateSettlementReconciliations` below.
export const paymentOrders = pgTable('payment_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  merchantOrderId: text('merchant_order_id').notNull().unique(),
  amountEgp: integer('amount_egp').notNull(),
  status: paymentOrderStatusEnum('status').notNull().default('pending_authorization'),
  providerReference: text('provider_reference'),
  authorizationDeadlineAt: timestamp('authorization_deadline_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// A webhook landing after its order already hit `refunded_timeout` opens this event
// instead of mutating `paymentOrders` — per COM-54's design, that's a manual finance
// ticket + compensating ledger entry, never an automatic state flip. No FK cascade
// from `paymentOrders` on delete: this is a compliance/finance record and must
// survive independent of the order row's own lifecycle.
export const lateSettlementReconciliations = pgTable('late_settlement_reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentOrderId: uuid('payment_order_id').notNull(),
  merchantOrderId: text('merchant_order_id').notNull(),
  providerReference: text('provider_reference').notNull(),
  rawWebhookPayload: text('raw_webhook_payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
