import { db, deals, listings } from '@committee/db';
import { desc, eq } from 'drizzle-orm';
import type { ListingType } from '@/lib/listings/validation';

export type DealFeedItem = {
  zone: string;
  propertyType: ListingType;
  agreedPriceEgp: number;
  // deals.updatedAt doubles as "closed at" — a deal's only two writes are
  // confirmations (see lib/deals/deals.ts), and the second one is the exact moment
  // status flips to 'closed', with no further writes after that. If deals ever grow
  // another post-close update path, this needs its own dedicated closedAt column.
  closedAt: Date;
};

// COM-22's public anonymized feed — zone/type/price only, no buyer/seller identity,
// callable with no session (see docs/projects/groundtruth.md: this is the platform's
// price data being checkable before a visitor ever signs up). Deliberately selects
// only these columns rather than `select().from(deals)`, so a future column added to
// `deals` can't leak here by accident.
export async function listPublicDealFeed(limit = 50): Promise<DealFeedItem[]> {
  return db
    .select({
      zone: listings.zone,
      propertyType: listings.propertyType,
      agreedPriceEgp: deals.agreedPriceEgp,
      closedAt: deals.updatedAt,
    })
    .from(deals)
    .innerJoin(listings, eq(deals.listingId, listings.id))
    .where(eq(deals.status, 'closed'))
    .orderBy(desc(deals.updatedAt))
    .limit(limit);
}
