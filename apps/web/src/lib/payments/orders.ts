import { deals, paymentOrders, pooledDb } from '@committee/db';
import { eq } from 'drizzle-orm';
import { authorize, confirmFromWebhook, expireToTimeout } from './payment-order-state-machine';

export class DealNotFoundError extends Error {}
export class PaymentOrderNotFoundError extends Error {}

// A payment order's authorization window (COM-54's binding design).
const AUTHORIZATION_WINDOW_MS = 30 * 60 * 1000;

// COM-55's actual deliverable: the DB-level unique constraint on
// `merchant_order_id` is the authoritative idempotency guard, unconditionally,
// regardless of what the spike found (or couldn't find — see
// docs/projects/groundtruth-payments-spike.md) about Paymob's own dedup behavior.
//
// Two callers racing to create an order for the same `merchantOrderId` both reach
// this function; `onConflictDoNothing` + a re-select means exactly one of them
// creates the row and both return the same, single order — never a thrown error for
// the loser, since "someone already started this exact payment attempt" is an
// expected outcome here, not a failure.
export async function createPaymentOrder(input: {
  dealId: string;
  merchantOrderId: string;
  amountEgp: number;
}) {
  const [deal] = await pooledDb.select().from(deals).where(eq(deals.id, input.dealId)).limit(1);
  if (!deal) {
    throw new DealNotFoundError('deal not found');
  }

  const [inserted] = await pooledDb
    .insert(paymentOrders)
    .values({
      dealId: deal.id,
      buyerId: deal.buyerId,
      sellerId: deal.sellerId,
      merchantOrderId: input.merchantOrderId,
      amountEgp: input.amountEgp,
    })
    .onConflictDoNothing({ target: paymentOrders.merchantOrderId })
    .returning();
  if (inserted) {
    return inserted;
  }

  const [existing] = await pooledDb
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.merchantOrderId, input.merchantOrderId))
    .limit(1);
  if (!existing) {
    // The conflicting row was deleted between the failed insert and this read —
    // vanishingly unlikely (this table has no delete path) but not impossible to
    // reason about incorrectly, so this stays a named error rather than a silent
    // undefined return.
    throw new PaymentOrderNotFoundError(
      `payment order for merchant_order_id ${input.merchantOrderId} disappeared after a conflicting insert`,
    );
  }
  return existing;
}

// Moves an order from pending_authorization to awaiting_webhook_confirmation once
// the provider has accepted the attempt, setting the 30-minute authorization
// deadline. Uses pooledDb + `.for('update')`, matching COM-19/COM-20's lock-then-
// transition pattern, so this can't race against a concurrent timeout sweep.
export async function authorizePaymentOrder(orderId: string) {
  return pooledDb.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, orderId))
      .for('update')
      .limit(1);
    if (!order) {
      throw new PaymentOrderNotFoundError('payment order not found');
    }

    const now = new Date();
    const next = authorize(order, new Date(now.getTime() + AUTHORIZATION_WINDOW_MS));
    const [updated] = await tx
      .update(paymentOrders)
      .set({
        status: next.status,
        authorizationDeadlineAt: next.authorizationDeadlineAt,
        updatedAt: now,
      })
      .where(eq(paymentOrders.id, orderId))
      .returning();
    return updated;
  });
}

// Applies a provider webhook reporting success. A webhook arriving once the order
// has already left awaiting_webhook_confirmation (most notably: after it timed out)
// must never mutate the order — see payment-order-state-machine.ts's
// LateSettlementError doc comment. The caller (the webhook route, not built in this
// M0 spike) is responsible for writing the resulting `lateSettlementReconciliations`
// row when this throws.
export async function confirmPaymentOrderFromWebhook(orderId: string) {
  return pooledDb.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, orderId))
      .for('update')
      .limit(1);
    if (!order) {
      throw new PaymentOrderNotFoundError('payment order not found');
    }

    const next = confirmFromWebhook(order);

    const [updated] = await tx
      .update(paymentOrders)
      .set({ status: next.status, updatedAt: new Date() })
      .where(eq(paymentOrders.id, orderId))
      .returning();
    return updated;
  });
}

// The timeout sweep's per-order transition (the sweep job itself — a scheduled task
// iterating orders past their deadline — is out of scope for this M0 spike; see the
// spike doc). No-ops for any order not actually past its deadline, so it's safe to
// call speculatively without a separate "is this order overdue?" check first.
export async function expirePaymentOrderIfOverdue(orderId: string) {
  return pooledDb.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, orderId))
      .for('update')
      .limit(1);
    if (!order) {
      throw new PaymentOrderNotFoundError('payment order not found');
    }

    const next = expireToTimeout(order, new Date());
    if (next.status === order.status) {
      return order;
    }

    const [updated] = await tx
      .update(paymentOrders)
      .set({ status: next.status, updatedAt: new Date() })
      .where(eq(paymentOrders.id, orderId))
      .returning();
    return updated;
  });
}
