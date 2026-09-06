import { deals, listings, negotiationEvents, negotiations, pooledDb } from '@committee/db';
import { and, eq } from 'drizzle-orm';
import {
  applyNegotiationAction,
  type NegotiationAction,
  type NegotiationParty,
} from './state-machine';

export class ListingNotAvailableError extends Error {}
export class CannotNegotiateOwnListingError extends Error {}
export class NegotiationAlreadyOpenError extends Error {}
export class NegotiationNotFoundError extends Error {}
export class NotNegotiationPartyError extends Error {}
export class InvalidOfferPriceError extends Error {}

function assertPositiveInteger(value: number, message: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new InvalidOfferPriceError(message);
  }
}

// Starts a negotiation thread with the buyer's opening offer. Uses pooledDb (not db)
// because checking "no other open negotiation for this buyer+listing" and inserting
// the row must happen without a concurrent duplicate request racing in between — see
// packages/db/CLAUDE.md's pooledDb note, which calls out offer state transitions
// explicitly. Buyer identity only needs to be authenticated (COM-18's session), not
// KYC-approved — that gate is specific to sellers publishing listings (COM-17).
export async function startNegotiation(buyerId: string, listingId: string, offerPriceEgp: number) {
  assertPositiveInteger(offerPriceEgp, 'offerPriceEgp must be a positive whole number');

  return pooledDb.transaction(async (tx) => {
    const [listing] = await tx.select().from(listings).where(eq(listings.id, listingId)).for('update').limit(1);
    if (!listing || listing.status !== 'active') {
      throw new ListingNotAvailableError('listing is not available for negotiation');
    }
    if (listing.sellerId === buyerId) {
      throw new CannotNegotiateOwnListingError('a seller cannot negotiate on their own listing');
    }

    const [existingOpen] = await tx
      .select()
      .from(negotiations)
      .where(and(eq(negotiations.listingId, listingId), eq(negotiations.buyerId, buyerId), eq(negotiations.status, 'open')))
      .limit(1);
    if (existingOpen) {
      throw new NegotiationAlreadyOpenError('an open negotiation already exists between this buyer and listing');
    }

    const [negotiation] = await tx
      .insert(negotiations)
      .values({
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        currentPriceEgp: offerPriceEgp,
        turn: 'seller',
      })
      .returning();

    await tx.insert(negotiationEvents).values({
      negotiationId: negotiation.id,
      actorId: buyerId,
      type: 'offer',
      priceEgp: offerPriceEgp,
    });

    return negotiation;
  });
}

// Applies a counter/accept/reject from `actorUserId`. Locks the negotiation row
// (`for('update')`) for the duration of the transaction so two near-simultaneous
// actions (e.g. buyer accepts while seller counters) can't both apply against the
// same stale `turn`/`status` snapshot — the second transaction re-reads post-lock
// and gets a state-machine error instead of corrupting the thread.
export async function respondToNegotiation(
  actorUserId: string,
  negotiationId: string,
  action: NegotiationAction,
  counterPriceEgp?: number,
) {
  return pooledDb.transaction(async (tx) => {
    const [negotiation] = await tx
      .select()
      .from(negotiations)
      .where(eq(negotiations.id, negotiationId))
      .for('update')
      .limit(1);
    if (!negotiation) {
      throw new NegotiationNotFoundError('negotiation not found');
    }

    let actor: NegotiationParty;
    if (negotiation.buyerId === actorUserId) {
      actor = 'buyer';
    } else if (negotiation.sellerId === actorUserId) {
      actor = 'seller';
    } else {
      throw new NotNegotiationPartyError('only the buyer or seller on this negotiation may act on it');
    }

    const next = applyNegotiationAction(
      { status: negotiation.status, currentPriceEgp: negotiation.currentPriceEgp, turn: negotiation.turn },
      actor,
      action,
      counterPriceEgp,
    );

    const [updated] = await tx
      .update(negotiations)
      .set({ status: next.status, currentPriceEgp: next.currentPriceEgp, turn: next.turn, updatedAt: new Date() })
      .where(eq(negotiations.id, negotiationId))
      .returning();

    await tx.insert(negotiationEvents).values({
      negotiationId,
      actorId: actorUserId,
      type: action,
      priceEgp: action === 'reject' ? null : next.currentPriceEgp,
    });

    // COM-20: an accepted negotiation immediately gets a 'pending' deal row, in the
    // same transaction — closing still requires both parties' independent
    // confirmation (see lib/deals/deals.ts), this just starts that clock.
    if (next.status === 'accepted') {
      await tx.insert(deals).values({
        negotiationId,
        listingId: negotiation.listingId,
        buyerId: negotiation.buyerId,
        sellerId: negotiation.sellerId,
        agreedPriceEgp: next.currentPriceEgp,
      });
    }

    return updated;
  });
}

export async function getNegotiationWithEvents(negotiationId: string) {
  const [negotiation] = await pooledDb.select().from(negotiations).where(eq(negotiations.id, negotiationId)).limit(1);
  if (!negotiation) {
    return null;
  }

  const events = await pooledDb
    .select()
    .from(negotiationEvents)
    .where(eq(negotiationEvents.negotiationId, negotiationId))
    .orderBy(negotiationEvents.createdAt);

  return { negotiation, events };
}
