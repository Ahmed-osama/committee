// Pure state-transition logic for the bot's fail-closed reliability design (the
// committee_plan round's core decision): PATROL_LOOP is normal unattended operation;
// RECOVERY_HALT is entered on *any* unrecognized screen (disconnect, CAPTCHA, popup,
// an unrecognized post-update UI) and never auto-recovers — only an explicit operator
// resume moves it back to PATROL_LOOP. The bot must never guess its way through an
// unrecognized screen; guessing under an MMO's anti-cheat is exactly the kind of
// mechanically-wrong action that gets an account flagged.
//
// Split from farming-loop.ts (capture/vision/input access) the same way
// apps/web/src/lib/deals/confirmation.ts splits pure merge logic from DB access —
// so the one rule that actually matters here (never leave recovery_halt without a
// human) is cheap to unit test exhaustively.

export type BotStatus = 'patrol_loop' | 'recovery_halt';

export type BotState = {
  status: BotStatus;
  // Set when entering recovery_halt — surfaced to the alert channel and to whatever
  // resumes the bot later, so "why did it stop" is never a mystery.
  haltReason: string | null;
};

export type BotEvent =
  | { type: 'target_detected' }
  | { type: 'unrecognized_screen'; reason: string }
  | { type: 'operator_resume' };

export const initialBotState: BotState = { status: 'patrol_loop', haltReason: null };

// Idempotent by construction: applying the same event twice from the same state
// yields the same result (e.g. a second unrecognized_screen while already halted
// just updates haltReason, it doesn't compound anything), matching this repo's
// general "promise once, receipt once" preference for state transitions.
export function applyBotEvent(state: BotState, event: BotEvent): BotState {
  switch (event.type) {
    case 'target_detected':
      // A recognized, expected screen — no-op in recovery_halt (only an explicit
      // operator_resume gets out of it) and a no-op in patrol_loop too, since
      // deciding what to *do* about a detected target is farming-loop.ts's job, not
      // this state machine's.
      return state;
    case 'unrecognized_screen':
      return { status: 'recovery_halt', haltReason: event.reason };
    case 'operator_resume':
      return { status: 'patrol_loop', haltReason: null };
  }
}
