import { db, deals, listings } from '@committee/db';
import { eq } from 'drizzle-orm';
import { computeValuationCells, findValuationForListing, type ValuationCell } from './valuation';

// Single read, no transaction needed — `db` is fine here (see packages/db/CLAUDE.md).
// Aggregation happens in-app (computeValuationCells) rather than a SQL GROUP BY on a
// computed area-band expression: GroundTruth's deal volume is small by design (one
// micro-zone at a time — docs/projects/groundtruth.md's go-to-market plan), so
// fetching all closed deals and bucketing in TypeScript is simpler than pushing the
// bucketing into SQL, and keeps the actual suppression-threshold logic unit-testable
// in valuation.ts without a database at all.
export async function getValuationCells(): Promise<ValuationCell[]> {
  const rows = await db
    .select({
      zone: listings.zone,
      propertyType: listings.propertyType,
      areaSqm: listings.areaSqm,
      priceEgp: deals.agreedPriceEgp,
    })
    .from(deals)
    .innerJoin(listings, eq(deals.listingId, listings.id))
    .where(eq(deals.status, 'closed'));

  return computeValuationCells(rows);
}

export async function getValuationForListing(zone: string, propertyType: string, areaSqm: number): Promise<ValuationCell | null> {
  const cells = await getValuationCells();
  return findValuationForListing(cells, zone, propertyType, areaSqm);
}
