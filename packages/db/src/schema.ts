import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Placeholder table proving the migration pipeline works end-to-end; real
// user/auth fields land with COM-18 (auth, KYC & compliance infrastructure).
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
