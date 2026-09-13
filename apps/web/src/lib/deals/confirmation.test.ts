import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyConfirmation, type DealConfirmationState } from './confirmation';

const t1 = new Date('2026-01-01T00:00:00Z');
const t2 = new Date('2026-01-02T00:00:00Z');

const pending = (overrides: Partial<DealConfirmationState> = {}): DealConfirmationState => ({
  status: 'pending',
  buyerConfirmedAt: null,
  sellerConfirmedAt: null,
  ...overrides,
});

test('a single confirmation does not close the deal', () => {
  const next = applyConfirmation(pending(), 'buyer', t1);
  assert.deepEqual(next, { status: 'pending', buyerConfirmedAt: t1, sellerConfirmedAt: null });
});

test('the deal closes only once both sides have confirmed', () => {
  const afterBuyer = applyConfirmation(pending(), 'buyer', t1);
  const afterSeller = applyConfirmation(afterBuyer, 'seller', t2);
  assert.deepEqual(afterSeller, { status: 'closed', buyerConfirmedAt: t1, sellerConfirmedAt: t2 });
});

test('order of confirmation does not matter', () => {
  const afterSeller = applyConfirmation(pending(), 'seller', t1);
  const afterBuyer = applyConfirmation(afterSeller, 'buyer', t2);
  assert.equal(afterBuyer.status, 'closed');
});

test('re-confirming after already confirming is a no-op (idempotent)', () => {
  const afterBuyer = applyConfirmation(pending(), 'buyer', t1);
  const again = applyConfirmation(afterBuyer, 'buyer', t2);
  assert.deepEqual(again, afterBuyer);
});

test('re-confirming after the deal is already closed changes nothing', () => {
  const closed = applyConfirmation(applyConfirmation(pending(), 'buyer', t1), 'seller', t2);
  const again = applyConfirmation(closed, 'buyer', new Date('2026-01-03T00:00:00Z'));
  assert.deepEqual(again, closed);
});
