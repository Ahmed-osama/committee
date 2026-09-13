import { db, deals, kycVerifications, listings, negotiations, users } from '@committee/db';
import { desc, eq, or } from 'drizzle-orm';

// Everything an operator can see while on a call, narrating account state per
// COM-35 — deliberately read-only: no function in this module writes to listings,
// negotiations, or deals. Looked up by phone since that's what a caller can give
// over the phone; there's no operator-facing search by name/id.
export async function findAccountByPhone(phone: string) {
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    return null;
  }

  const [kyc, sellerListings, negotiationRows, dealRows] = await Promise.all([
    db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, user.id))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(1),
    db.select().from(listings).where(eq(listings.sellerId, user.id)),
    db
      .select()
      .from(negotiations)
      .where(or(eq(negotiations.buyerId, user.id), eq(negotiations.sellerId, user.id))),
    db.select().from(deals).where(or(eq(deals.buyerId, user.id), eq(deals.sellerId, user.id))),
  ]);

  return {
    user,
    kyc: kyc[0] ?? null,
    listings: sellerListings,
    negotiations: negotiationRows,
    deals: dealRows,
  };
}
