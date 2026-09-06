import { db, deals, kycVerifications, listings, negotiations, users } from '@committee/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { getValuationCells } from '@/lib/valuation/engine';
import { findValuationForListing } from '@/lib/valuation/valuation';
import { isHighActivityNoClose, isPriceOutlier } from './flags';

// Read-only reporting queries for COM-24's dashboard — never used to take action
// automatically (no auto-suspend, no auto-delist). A human reviews these lists and
// decides; see docs/projects/groundtruth.md's staffed-fallback philosophy for why
// this platform generally prefers a human decision point over silent automation.
export async function getRejectedKycSubmissions() {
  return db
    .select({
      id: kycVerifications.id,
      userId: kycVerifications.userId,
      phone: users.phone,
      rejectionReason: kycVerifications.rejectionReason,
      createdAt: kycVerifications.createdAt,
    })
    .from(kycVerifications)
    .innerJoin(users, eq(kycVerifications.userId, users.id))
    .where(eq(kycVerifications.status, 'rejected'))
    .orderBy(desc(kycVerifications.createdAt));
}

export async function getHighActivityBuyersWithNoClose() {
  const negotiationCounts = await db
    .select({ buyerId: negotiations.buyerId, negotiationCount: sql<number>`count(*)`.mapWith(Number) })
    .from(negotiations)
    .groupBy(negotiations.buyerId);

  const closedCounts = await db
    .select({ buyerId: deals.buyerId, closedCount: sql<number>`count(*)`.mapWith(Number) })
    .from(deals)
    .where(eq(deals.status, 'closed'))
    .groupBy(deals.buyerId);
  const closedByBuyer = new Map(closedCounts.map((row) => [row.buyerId, row.closedCount]));

  const flagged = negotiationCounts.filter((row) => isHighActivityNoClose(row.negotiationCount, closedByBuyer.get(row.buyerId) ?? 0));
  if (flagged.length === 0) {
    return [];
  }

  const phonesByUserId = new Map(
    (
      await db
        .select({ id: users.id, phone: users.phone })
        .from(users)
        .where(inArray(users.id, flagged.map((row) => row.buyerId)))
    ).map((row) => [row.id, row.phone]),
  );

  return flagged.map((row) => ({
    buyerId: row.buyerId,
    phone: phonesByUserId.get(row.buyerId) ?? '(unknown)',
    negotiationCount: row.negotiationCount,
    closedDealCount: closedByBuyer.get(row.buyerId) ?? 0,
  }));
}

export async function getPriceOutlierDeals() {
  const cells = await getValuationCells();
  if (cells.length === 0) {
    return [];
  }

  const closedRows = await db
    .select({
      dealId: deals.id,
      agreedPriceEgp: deals.agreedPriceEgp,
      zone: listings.zone,
      propertyType: listings.propertyType,
      areaSqm: listings.areaSqm,
    })
    .from(deals)
    .innerJoin(listings, eq(deals.listingId, listings.id))
    .where(eq(deals.status, 'closed'));

  return closedRows.flatMap((row) => {
    const cell = findValuationForListing(cells, row.zone, row.propertyType, row.areaSqm);
    if (!cell) {
      return [];
    }
    const pricePerSqmEgp = Math.round(row.agreedPriceEgp / row.areaSqm);
    if (!isPriceOutlier(pricePerSqmEgp, cell.avgPricePerSqmEgp)) {
      return [];
    }
    return [{ dealId: row.dealId, pricePerSqmEgp, cellAvgPricePerSqmEgp: cell.avgPricePerSqmEgp }];
  });
}
