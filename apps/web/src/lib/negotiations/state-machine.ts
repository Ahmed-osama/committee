// Pure state-transition logic for COM-19's fixed offer/counter/accept/reject
// negotiation state machine — no DB access, so it's cheap to unit test exhaustively
// (see state-machine.test.ts) independent of the Neon-driver-needs-a-real-endpoint
// limitation documented in packages/db/CLAUDE.md. negotiations.ts wraps this with the
// actual reads/writes.

export type NegotiationStatus = 'open' | 'accepted' | 'rejected';
export type NegotiationTurn = 'buyer' | 'seller';
export type NegotiationAction = 'counter' | 'accept' | 'reject';
export type NegotiationParty = 'buyer' | 'seller';

export type NegotiationState = {
  status: NegotiationStatus;
  currentPriceEgp: number;
  turn: NegotiationTurn;
};

export class NegotiationNotOpenError extends Error {}
export class NotYourTurnError extends Error {}
export class InvalidCounterPriceError extends Error {}

// Applies `action` (taken by `actor`) to `state`, returning the next state. Throws
// rather than silently no-opping on an illegal transition — every caller (the DB
// wrapper, any future API surface) must handle these explicitly rather than trusting
// client-submitted state.
export function applyNegotiationAction(
  state: NegotiationState,
  actor: NegotiationParty,
  action: NegotiationAction,
  counterPriceEgp?: number,
): NegotiationState {
  if (state.status !== 'open') {
    throw new NegotiationNotOpenError(`negotiation is ${state.status}, no further actions allowed`);
  }
  if (state.turn !== actor) {
    throw new NotYourTurnError(`it is the ${state.turn}'s turn, not the ${actor}'s`);
  }

  switch (action) {
    case 'accept':
      return { ...state, status: 'accepted' };
    case 'reject':
      return { ...state, status: 'rejected' };
    case 'counter': {
      if (
        typeof counterPriceEgp !== 'number' ||
        !Number.isFinite(counterPriceEgp) ||
        !Number.isInteger(counterPriceEgp) ||
        counterPriceEgp <= 0
      ) {
        throw new InvalidCounterPriceError('counterPriceEgp must be a positive whole number');
      }
      return {
        status: 'open',
        currentPriceEgp: counterPriceEgp,
        turn: actor === 'buyer' ? 'seller' : 'buyer',
      };
    }
  }
}
