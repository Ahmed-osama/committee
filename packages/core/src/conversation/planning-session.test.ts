import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canOfferFinalize } from './planning-session.js';

test('finalize is never offered until every agent has spoken at least once', () => {
  const agentCount = 3; // planner, architect, skeptic
  // Turns 0, 1, 2 are everyone's first round — finalize must not be offered yet,
  // regardless of whose turn it is, including the finalizer's own first turn (turn 1).
  assert.equal(canOfferFinalize(0, agentCount), false);
  assert.equal(canOfferFinalize(1, agentCount), false);
  assert.equal(canOfferFinalize(2, agentCount), false);
  // From turn 3 onward, everyone has had a turn — the finalizer's second
  // turn (turn 4) is a real basis for a decision, unlike its first (turn 1).
  assert.equal(canOfferFinalize(3, agentCount), true);
  assert.equal(canOfferFinalize(4, agentCount), true);
});
