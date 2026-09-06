// Pure merge logic for COM-20's dual confirmation — split out from deals.ts (DB
// access) the same way COM-19 split state-machine.ts from negotiations.ts, so the
// correctness-critical part (when does a deal actually flip to 'closed'?) is cheap
// to unit test exhaustively.

export type DealStatus = 'pending' | 'closed';

export type DealConfirmationState = {
  status: DealStatus;
  buyerConfirmedAt: Date | null;
  sellerConfirmedAt: Date | null;
};

// Idempotent: confirming again after already confirming (or after the deal is
// already closed) is a no-op that returns the same timestamps — see deals.ts's
// "promise once, receipt once" note. `now` is injected so this stays deterministic
// under test rather than reading the clock itself.
export function applyConfirmation(state: DealConfirmationState, actor: 'buyer' | 'seller', now: Date): DealConfirmationState {
  const buyerConfirmedAt = actor === 'buyer' ? (state.buyerConfirmedAt ?? now) : state.buyerConfirmedAt;
  const sellerConfirmedAt = actor === 'seller' ? (state.sellerConfirmedAt ?? now) : state.sellerConfirmedAt;
  const status: DealStatus = buyerConfirmedAt && sellerConfirmedAt ? 'closed' : state.status;

  return { status, buyerConfirmedAt, sellerConfirmedAt };
}
