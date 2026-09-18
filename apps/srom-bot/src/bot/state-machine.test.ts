import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyBotEvent, initialBotState, type BotState } from './state-machine.js';

test('starts in patrol_loop with no halt reason', () => {
  assert.deepEqual(initialBotState, { status: 'patrol_loop', haltReason: null });
});

test('target_detected is a no-op in patrol_loop', () => {
  const next = applyBotEvent(initialBotState, { type: 'target_detected' });
  assert.deepEqual(next, initialBotState);
});

test('unrecognized_screen halts unconditionally, carrying the reason', () => {
  const next = applyBotEvent(initialBotState, {
    type: 'unrecognized_screen',
    reason: 'no known UI template matched',
  });
  assert.deepEqual(next, { status: 'recovery_halt', haltReason: 'no known UI template matched' });
});

test('target_detected is also a no-op once halted — it never auto-resumes', () => {
  const halted: BotState = { status: 'recovery_halt', haltReason: 'disconnect' };
  const next = applyBotEvent(halted, { type: 'target_detected' });
  assert.deepEqual(next, halted);
});

test('a second unrecognized_screen while already halted updates the reason, not the status', () => {
  const halted: BotState = { status: 'recovery_halt', haltReason: 'disconnect' };
  const next = applyBotEvent(halted, { type: 'unrecognized_screen', reason: 'CAPTCHA' });
  assert.deepEqual(next, { status: 'recovery_halt', haltReason: 'CAPTCHA' });
});

test('operator_resume is the only way back to patrol_loop', () => {
  const halted: BotState = { status: 'recovery_halt', haltReason: 'disconnect' };
  const next = applyBotEvent(halted, { type: 'operator_resume' });
  assert.deepEqual(next, { status: 'patrol_loop', haltReason: null });
});
