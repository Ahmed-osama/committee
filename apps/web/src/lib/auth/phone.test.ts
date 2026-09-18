import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isEgyptianE164Phone } from './phone.js';

test('accepts valid Egyptian mobile numbers in E.164', () => {
  assert.equal(isEgyptianE164Phone('+201001234567'), true);
  assert.equal(isEgyptianE164Phone('+201112345678'), true);
  assert.equal(isEgyptianE164Phone('+201234567890'), true);
  assert.equal(isEgyptianE164Phone('+201512345678'), true);
});

test('rejects non-Egyptian or malformed numbers', () => {
  assert.equal(isEgyptianE164Phone('01001234567'), false); // missing +20
  assert.equal(isEgyptianE164Phone('+11001234567'), false); // wrong country code
  assert.equal(isEgyptianE164Phone('+2013012345'), false); // invalid prefix
  assert.equal(isEgyptianE164Phone('+20100123456'), false); // too short
  assert.equal(isEgyptianE164Phone('+2010012345678'), false); // too long
});
