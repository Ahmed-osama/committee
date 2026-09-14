import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  authorize,
  confirmFromWebhook,
  expireToTimeout,
  LateSettlementError,
  type PaymentOrderState,
} from './payment-order-state-machine';

const deadline = new Date('2026-01-01T00:30:00Z');
const beforeDeadline = new Date('2026-01-01T00:29:59Z');
const afterDeadline = new Date('2026-01-01T00:30:01Z');

const pending = (overrides: Partial<PaymentOrderState> = {}): PaymentOrderState => ({
  status: 'pending_authorization',
  authorizationDeadlineAt: null,
  ...overrides,
});

test('authorize moves pending_authorization to awaiting_webhook_confirmation with a deadline', () => {
  const next = authorize(pending(), deadline);
  assert.deepEqual(next, {
    status: 'awaiting_webhook_confirmation',
    authorizationDeadlineAt: deadline,
  });
});

test('authorize is a no-op once already past pending_authorization', () => {
  const awaiting = authorize(pending(), deadline);
  const again = authorize(awaiting, new Date('2026-01-01T01:00:00Z'));
  assert.deepEqual(again, awaiting);
});

test('confirmFromWebhook moves awaiting_webhook_confirmation to confirmed', () => {
  const awaiting = authorize(pending(), deadline);
  const confirmed = confirmFromWebhook(awaiting);
  assert.deepEqual(confirmed, { status: 'confirmed', authorizationDeadlineAt: deadline });
});

test('confirmFromWebhook is idempotent for a retried webhook on an already-confirmed order', () => {
  const confirmed = confirmFromWebhook(authorize(pending(), deadline));
  const again = confirmFromWebhook(confirmed);
  assert.deepEqual(again, confirmed);
});

test('confirmFromWebhook throws LateSettlementError for an order still pending_authorization', () => {
  assert.throws(() => confirmFromWebhook(pending()), LateSettlementError);
});

test('expireToTimeout flips to refunded_timeout once the deadline has passed', () => {
  const awaiting = authorize(pending(), deadline);
  const expired = expireToTimeout(awaiting, afterDeadline);
  assert.deepEqual(expired, { status: 'refunded_timeout', authorizationDeadlineAt: deadline });
});

test('expireToTimeout does not fire before the deadline', () => {
  const awaiting = authorize(pending(), deadline);
  const stillAwaiting = expireToTimeout(awaiting, beforeDeadline);
  assert.deepEqual(stillAwaiting, awaiting);
});

test('expireToTimeout is a no-op for a status other than awaiting_webhook_confirmation', () => {
  assert.deepEqual(expireToTimeout(pending(), afterDeadline), pending());
  const confirmed = confirmFromWebhook(authorize(pending(), deadline));
  assert.deepEqual(expireToTimeout(confirmed, afterDeadline), confirmed);
});

test('confirmFromWebhook throws LateSettlementError once an order has already timed out', () => {
  const expired = expireToTimeout(authorize(pending(), deadline), afterDeadline);
  assert.throws(() => confirmFromWebhook(expired), LateSettlementError);
});
