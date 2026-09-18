import type { Frame, ScreenCapture } from '../capture/screen-capture.js';
import type { TouchInput } from '../input/touch-input.js';
import { findTemplate, type Match } from '../vision/template-match.js';
import type { AlertChannel } from './alert-channel.js';
import { applyBotEvent, type BotState } from './state-machine.js';

// A known screen element the loop watches for. 'target' means "tap it" (a mob, a
// resource node, a farming prompt); 'known_neutral' means "this is an expected
// screen with nothing to act on" (e.g. the empty patrol view) — recognized, but not
// actionable. Anything the frame contains that matches *neither* kind is what drives
// the state machine into recovery_halt; see state-machine.ts's doc comment on why
// that's a halt rather than a guess.
export type DetectionTemplate = {
  name: string;
  kind: 'target' | 'known_neutral';
  template: Frame;
  threshold: number;
};

export type FarmingLoopDeps = {
  capture: ScreenCapture;
  input: TouchInput;
  alerts: AlertChannel;
  templates: DetectionTemplate[];
};

// One tick of the farming loop: capture a frame, check it against every known
// template, and either act on the best-scoring target, do nothing (a recognized but
// non-actionable screen), or halt (nothing recognized at all). A no-op once already
// halted — the caller (whatever schedules ticks; not built yet, see this package's
// CLAUDE.md) is responsible for stopping the schedule on recovery_halt and only
// resuming it once an operator_resume event has been applied elsewhere.
export async function runFarmingLoopTick(
  deps: FarmingLoopDeps,
  state: BotState,
): Promise<BotState> {
  if (state.status === 'recovery_halt') {
    return state;
  }

  const frame = await deps.capture.captureFrame();

  let bestTarget: (Match & { name: string }) | null = null;
  let anyKnownMatch = false;

  for (const candidate of deps.templates) {
    const match = findTemplate(frame, candidate.template, candidate.threshold);
    if (!match) {
      continue;
    }
    anyKnownMatch = true;
    if (candidate.kind === 'target' && (!bestTarget || match.score > bestTarget.score)) {
      bestTarget = { ...match, name: candidate.name };
    }
  }

  if (!anyKnownMatch) {
    const next = applyBotEvent(state, {
      type: 'unrecognized_screen',
      reason: 'no known template matched this frame',
    });
    await deps.alerts.notify(`srom-bot halted: ${next.haltReason}`);
    return next;
  }

  if (bestTarget) {
    await deps.input.tap(bestTarget.x, bestTarget.y);
    return applyBotEvent(state, { type: 'target_detected' });
  }

  return state;
}
