import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isEgyptianNationalId } from './national-id.js';

test('accepts a 14-digit id', () => {
  assert.equal(isEgyptianNationalId('29001011234567'), true);
});

test('rejects wrong-length or non-numeric ids', () => {
  assert.equal(isEgyptianNationalId('2900101123456'), false);
  assert.equal(isEgyptianNationalId('290010112345678'), false);
  assert.equal(isEgyptianNationalId('2900101123456a'), false);
});
