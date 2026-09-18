// Pure state-transition logic for COM-54/COM-55's buyer-to-seller payment order
// state machine — split out from orders.ts (DB access) the same way COM-19/COM-20
// split their state machines from their DB-backed wrappers, so the
// correctness-critical transitions are cheap to unit test exhaustively.
//
// This is the binding design from COM-54's committee_plan round (conversation
// c56d2dbc): pending_authorization -> awaiting_webhook_confirmation (a 30-minute
// authorization window) -> confirmed | refunded_timeout. A webhook landing once an
// order has already reached refunded_timeout must never flip it back to confirmed —
// see `LateSettlementError`.

export type PaymentOrderStatus =
  'pending_authorization' | 'awaiting_webhook_confirmation' | 'confirmed' | 'refunded_timeout';

export type PaymentOrderState = {
  status: PaymentOrderStatus;
  authorizationDeadlineAt: Date | null;
};

// Raised when a webhook reports success for an order that has already left
// awaiting_webhook_confirmation (most notably: after it timed out to
// refunded_timeout). The caller must catch this and open a
// `lateSettlementReconciliations` row instead of applying the transition — never
// mutate `paymentOrders` in that case.
export class LateSettlementError extends Error {}

// Called once the provider has accepted the authorization attempt (a real Paymob
// call in production; the M0 spike has no real call to make yet — see
// docs/projects/groundtruth-payments-spike.md). Idempotent: calling this again on an
// order already past pending_authorization is a no-op, since createPaymentOrder's
// unique-constraint guard (orders.ts) is what actually prevents a second concurrent
// authorization attempt from reaching here at all.
export function authorize(
  state: PaymentOrderState,
  authorizationDeadlineAt: Date,
): PaymentOrderState {
  if (state.status !== 'pending_authorization') {
    return state;
  }
  return { status: 'awaiting_webhook_confirmation', authorizationDeadlineAt };
}

// Called when a webhook reports the payment succeeded. Idempotent for a retried
// webhook delivery against an already-confirmed order (returns the same state);
// throws LateSettlementError for a webhook arriving after the order already timed
// out, per this module's doc comment above.
export function confirmFromWebhook(state: PaymentOrderState): PaymentOrderState {
  if (state.status === 'confirmed') {
    return state;
  }
  if (state.status !== 'awaiting_webhook_confirmation') {
    throw new LateSettlementError(
      `webhook confirmation received for an order in status "${state.status}"`,
    );
  }
  return { status: 'confirmed', authorizationDeadlineAt: state.authorizationDeadlineAt };
}

// Called by the timeout sweep (a scheduled job, not implemented in this M0 spike —
// see the spike doc's scope note) once `now` has passed `authorizationDeadlineAt`
// for an order still awaiting confirmation. A no-op for any other status, or if the
// deadline hasn't actually passed yet, so this is safe to call speculatively.
export function expireToTimeout(state: PaymentOrderState, now: Date): PaymentOrderState {
  if (state.status !== 'awaiting_webhook_confirmation') {
    return state;
  }
  if (!state.authorizationDeadlineAt || now < state.authorizationDeadlineAt) {
    return state;
  }
  return { status: 'refunded_timeout', authorizationDeadlineAt: state.authorizationDeadlineAt };
}
