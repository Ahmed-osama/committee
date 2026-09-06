import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
