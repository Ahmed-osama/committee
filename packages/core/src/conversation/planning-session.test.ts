import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Message } from '../domain/message.js';
import { canOfferFinalize, hasSkepticAgreed } from './planning-session.js';

function fakeMessage(overrides: Partial<Message>): Message {
  return {
    id: 'm1',
    conversationId: 'c1',
    fromAgentId: 'someone',
    intent: 'propose',
    content: 'x',
    turn: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

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

test('no panel has no skeptic to agree — nothing to gate on', () => {
  assert.equal(hasSkepticAgreed([], undefined), true);
});

test('finalize cannot happen before the skeptic has said anything at all', () => {
  assert.equal(hasSkepticAgreed([], 'skeptic-1'), false);
});

test("the skeptic's live objection blocks finalize, even if it spoke most recently among its own turns", () => {
  const transcript = [
    fakeMessage({ fromAgentId: 'planner-1', intent: 'propose', turn: 0 }),
    fakeMessage({ fromAgentId: 'skeptic-1', intent: 'challenge', turn: 1 }),
  ];
  assert.equal(hasSkepticAgreed(transcript, 'skeptic-1'), false);
});

test('an explicit agree turn from the skeptic unlocks finalize', () => {
  const transcript = [
    fakeMessage({ fromAgentId: 'planner-1', intent: 'propose', turn: 0 }),
    fakeMessage({ fromAgentId: 'skeptic-1', intent: 'challenge', turn: 1 }),
    fakeMessage({ fromAgentId: 'planner-1', intent: 'propose', turn: 2 }),
    fakeMessage({ fromAgentId: 'skeptic-1', intent: 'agree', turn: 3 }),
  ];
  assert.equal(hasSkepticAgreed(transcript, 'skeptic-1'), true);
});
