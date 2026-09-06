import { integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

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

export const negotiationEventTypeEnum = pgEnum('negotiation_event_type', ['offer', 'counter', 'accept', 'reject']);

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

export const creditPurchaseStatusEnum = pgEnum('credit_purchase_status', ['pending', 'completed', 'failed']);

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

// One row per (listing, buyer) — the pay-to-reveal paywall's gate. A unique
// constraint on the pair means a buyer is only ever charged once per listing;
// revisiting an already-revealed listing re-reads this row instead of re-charging.
export const contactReveals = pgTable('contact_reveals', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  creditsSpent: integer('credits_spent').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique().on(table.listingId, table.buyerId)]);
