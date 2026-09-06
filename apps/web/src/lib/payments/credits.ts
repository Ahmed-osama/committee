import { contactReveals, creditLedgerEntries, creditPurchases, db, listings, pooledDb, users } from '@committee/db';
import { and, eq, sql } from 'drizzle-orm';
import { findCreditPackage, REVEAL_COST_CREDITS } from './packages';
import { paymentProvider } from './providers';

export class UnknownCreditPackageError extends Error {}
export class InvalidWebhookSignatureError extends Error {}
export class PurchaseNotFoundError extends Error {}
export class ListingNotFoundError extends Error {}
export class CannotRevealOwnListingError extends Error {}
export class InsufficientCreditsError extends Error {}

// Balance is always derived by summing the ledger, never a mutable counter — see
// packages/db/CLAUDE.md's schema notes on why. A single-statement aggregate, so `db`
// (not `pooledDb`) is fine here.
export async function getCreditBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${creditLedgerEntries.amount}), 0)`.mapWith(Number) })
    .from(creditLedgerEntries)
    .where(eq(creditLedgerEntries.userId, userId));
  return row?.total ?? 0;
}

// Starts a checkout for a credit package. No credits are granted here — only once
// handlePaymentWebhook below observes a 'succeeded' event for this purchase.
export async function startCreditPurchase(userId: string, packageId: string) {
  const creditPackage = findCreditPackage(packageId);
  if (!creditPackage) {
    throw new UnknownCreditPackageError(`unknown credit package: ${packageId}`);
  }

  const checkout = await paymentProvider.createCheckout({ userId, creditPackage });
  await db.insert(creditPurchases).values({
    userId,
    providerReference: checkout.providerReference,
    packageId: creditPackage.id,
    credits: creditPackage.credits,
    priceEgp: creditPackage.priceEgp,
  });
  return checkout;
}

// Processes a payment webhook. Uses pooledDb (not db) because checking the
// purchase's current status and reacting to it must happen as one lock-held unit —
// Paymob (like most payment vendors) can and does retry webhook delivery, and this
// must be safe to call more than once for the same event without double-crediting.
export async function handlePaymentWebhook(rawBody: string, signatureHeader: string | null) {
  const event = signatureHeader ? paymentProvider.parseWebhookEvent(rawBody, signatureHeader) : null;
  if (!event) {
    throw new InvalidWebhookSignatureError('webhook signature missing or invalid');
  }

  return pooledDb.transaction(async (tx) => {
    const [purchase] = await tx
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.providerReference, event.providerReference))
      .for('update')
      .limit(1);
    if (!purchase) {
      throw new PurchaseNotFoundError(`no purchase found for reference ${event.providerReference}`);
    }
    if (purchase.status !== 'pending') {
      return purchase;
    }

    const status = event.status === 'succeeded' ? 'completed' : 'failed';
    const [updated] = await tx
      .update(creditPurchases)
      .set({ status, updatedAt: new Date() })
      .where(eq(creditPurchases.id, purchase.id))
      .returning();

    if (status === 'completed') {
      await tx.insert(creditLedgerEntries).values({
        userId: purchase.userId,
        amount: purchase.credits,
        reason: 'purchase',
        referenceId: purchase.id,
      });
    }

    return updated;
  });
}

// Read-only check for whether `buyerId` has already paid to reveal `listingId` —
// used by the listing detail page to decide whether to render the revealed phone or
// the "reveal" form, without itself ever charging.
export async function getExistingReveal(buyerId: string, listingId: string): Promise<{ phone: string } | null> {
  const [existing] = await db
    .select()
    .from(contactReveals)
    .where(and(eq(contactReveals.listingId, listingId), eq(contactReveals.buyerId, buyerId)))
    .limit(1);
  if (!existing) {
    return null;
  }

  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) {
    return null;
  }
  const [seller] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, listing.sellerId)).limit(1);
  return { phone: seller?.phone ?? '' };
}

// Pay-to-reveal: charges REVEAL_COST_CREDITS the first time `buyerId` reveals
// `listingId`'s seller contact info, then returns that phone number on every
// subsequent call without charging again (the unique (listingId, buyerId) index is
// the actual re-charge guard; this early-return is just the fast path).
//
// Uses pooledDb + `.for('update')` on the buyer's own ledger rows: two
// near-simultaneous reveals (of different listings) by the same buyer must not both
// read the same pre-spend balance and both succeed past a balance that only covers
// one of them. Known gap: if the buyer has zero ledger rows yet, there's nothing to
// lock, but balance is 0 either way, so the only consequence is both would
// consistently fail with InsufficientCreditsError, not both succeed — not a real
// double-spend risk in that specific case.
export async function revealSellerContact(buyerId: string, listingId: string): Promise<{ phone: string; alreadyRevealed: boolean }> {
  return pooledDb.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(contactReveals)
      .where(and(eq(contactReveals.listingId, listingId), eq(contactReveals.buyerId, buyerId)))
      .limit(1);

    const [listing] = await tx.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing) {
      throw new ListingNotFoundError('listing not found');
    }

    if (existing) {
      const [seller] = await tx.select({ phone: users.phone }).from(users).where(eq(users.id, listing.sellerId)).limit(1);
      return { phone: seller?.phone ?? '', alreadyRevealed: true };
    }

    if (listing.sellerId === buyerId) {
      throw new CannotRevealOwnListingError('a seller cannot pay to reveal their own listing');
    }

    const ledgerRows = await tx.select().from(creditLedgerEntries).where(eq(creditLedgerEntries.userId, buyerId)).for('update');
    const balance = ledgerRows.reduce((sum, row) => sum + row.amount, 0);
    if (balance < REVEAL_COST_CREDITS) {
      throw new InsufficientCreditsError('insufficient credit balance to reveal contact info');
    }

    await tx.insert(creditLedgerEntries).values({
      userId: buyerId,
      amount: -REVEAL_COST_CREDITS,
      reason: 'reveal',
      referenceId: listingId,
    });
    await tx.insert(contactReveals).values({ listingId, buyerId, creditsSpent: REVEAL_COST_CREDITS });

    const [seller] = await tx.select({ phone: users.phone }).from(users).where(eq(users.id, listing.sellerId)).limit(1);
    return { phone: seller?.phone ?? '', alreadyRevealed: false };
  });
}
