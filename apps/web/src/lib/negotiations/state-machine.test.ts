import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyNegotiationAction,
  InvalidCounterPriceError,
  NegotiationNotOpenError,
  NotYourTurnError,
  type NegotiationState,
} from './state-machine';

const open = (overrides: Partial<NegotiationState> = {}): NegotiationState => ({
  status: 'open',
  currentPriceEgp: 1_000_000,
  turn: 'seller',
  ...overrides,
});

test('seller can accept the buyer initial offer', () => {
  const next = applyNegotiationAction(open(), 'seller', 'accept');
  assert.deepEqual(next, { status: 'accepted', currentPriceEgp: 1_000_000, turn: 'seller' });
});

test('seller can reject the buyer initial offer', () => {
  const next = applyNegotiationAction(open(), 'seller', 'reject');
  assert.equal(next.status, 'rejected');
});

test('seller countering flips the turn to buyer and updates the price', () => {
  const next = applyNegotiationAction(open(), 'seller', 'counter', 1_200_000);
  assert.deepEqual(next, { status: 'open', currentPriceEgp: 1_200_000, turn: 'buyer' });
});

test('buyer can then accept the seller counter', () => {
  const afterCounter = applyNegotiationAction(open(), 'seller', 'counter', 1_200_000);
  const next = applyNegotiationAction(afterCounter, 'buyer', 'accept');
  assert.deepEqual(next, { status: 'accepted', currentPriceEgp: 1_200_000, turn: 'buyer' });
});

test('acting out of turn is rejected', () => {
  assert.throws(() => applyNegotiationAction(open(), 'buyer', 'accept'), NotYourTurnError);
});

test('acting on a non-open negotiation is rejected', () => {
  const accepted = open({ status: 'accepted' });
  assert.throws(() => applyNegotiationAction(accepted, 'seller', 'counter', 1), NegotiationNotOpenError);
});

test('countering requires a positive whole-number price', () => {
  assert.throws(() => applyNegotiationAction(open(), 'seller', 'counter', 0), InvalidCounterPriceError);
  assert.throws(() => applyNegotiationAction(open(), 'seller', 'counter', -5), InvalidCounterPriceError);
  assert.throws(() => applyNegotiationAction(open(), 'seller', 'counter', 1.5), InvalidCounterPriceError);
  assert.throws(() => applyNegotiationAction(open(), 'seller', 'counter', undefined), InvalidCounterPriceError);
});

test('accept/reject ignore any counterPriceEgp argument', () => {
  const next = applyNegotiationAction(open(), 'seller', 'accept', 999);
  assert.equal(next.currentPriceEgp, 1_000_000);
});
