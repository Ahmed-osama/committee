import { deals, pooledDb } from '@committee/db';
import { eq } from 'drizzle-orm';
import { applyConfirmation } from './confirmation';

export class DealNotFoundError extends Error {}
export class NotDealPartyError extends Error {}

// COM-20's dual-confirmed closure: a deal only flips to 'closed' once BOTH
// buyerConfirmedAt and sellerConfirmedAt are set — neither party's confirmation
// alone is enough (see docs/projects/groundtruth.md's anti-collusion mechanism).
// Uses pooledDb + `.for('update')` (not `db`) for the same reason as COM-19's offer
// transitions: reading "is the other side already confirmed?" and writing this
// party's confirmation must happen as one lock-held unit, or two near-simultaneous
// confirmations could both read "not yet closed" and neither would observe the
// other's write in time to flip status to 'closed' (a lost update).
//
// Idempotent: confirming again after already confirming (or after the deal is
// already closed) just returns the current row — matches the "promise once, receipt
// once" rule (root CLAUDE.md/round 3): no nagging re-confirmation error.
export async function confirmDeal(userId: string, dealId: string) {
  return pooledDb.transaction(async (tx) => {
    const [deal] = await tx.select().from(deals).where(eq(deals.id, dealId)).for('update').limit(1);
    if (!deal) {
      throw new DealNotFoundError('deal not found');
    }

    const isBuyer = deal.buyerId === userId;
    const isSeller = deal.sellerId === userId;
    if (!isBuyer && !isSeller) {
      throw new NotDealPartyError('only the buyer or seller on this deal may confirm it');
    }

    const next = applyConfirmation(deal, isBuyer ? 'buyer' : 'seller', new Date());

    const [updated] = await tx
      .update(deals)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(deals.id, dealId))
      .returning();

    return updated;
  });
}

export async function getDeal(dealId: string) {
  const [deal] = await pooledDb.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  return deal ?? null;
}

export async function getDealByNegotiationId(negotiationId: string) {
  const [deal] = await pooledDb.select().from(deals).where(eq(deals.negotiationId, negotiationId)).limit(1);
  return deal ?? null;
}
