import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionToken, verifySessionToken } from './session.js';

test('round-trips a valid session token', () => {
  const token = createSessionToken({ userId: 'user-1', role: 'user' }, 'secret');
  assert.deepEqual(verifySessionToken(token, 'secret'), { userId: 'user-1', role: 'user' });
});

test('rejects a token signed with a different secret', () => {
  const token = createSessionToken({ userId: 'user-1', role: 'admin' }, 'secret-a');
  assert.equal(verifySessionToken(token, 'secret-b'), null);
});

test('rejects a tampered payload', () => {
  const token = createSessionToken({ userId: 'user-1', role: 'user' }, 'secret');
  const signature = token.split('.')[1];
  const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'user-2', role: 'admin' })).toString('base64url');
  assert.equal(verifySessionToken(`${tamperedPayload}.${signature}`, 'secret'), null);
});

test('rejects malformed tokens', () => {
  assert.equal(verifySessionToken('not-a-token', 'secret'), null);
  assert.equal(verifySessionToken('', 'secret'), null);
});
