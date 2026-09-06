import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InvalidListingInputError, validateListingInput } from './validation.js';

const VALID_INPUT = {
  title: '  Nice apartment  ',
  description: 'Two bedrooms, near the market.',
  zone: 'North zone',
  propertyType: 'apartment',
  areaSqm: 90,
  priceEgp: 1_500_000,
};

test('accepts and trims a valid listing', () => {
  const result = validateListingInput(VALID_INPUT);
  assert.deepEqual(result, {
    title: 'Nice apartment',
    description: 'Two bedrooms, near the market.',
    zone: 'North zone',
    propertyType: 'apartment',
    areaSqm: 90,
    priceEgp: 1_500_000,
  });
});

test('coerces numeric form-data strings', () => {
  const result = validateListingInput({ ...VALID_INPUT, areaSqm: '90', priceEgp: '1500000' });
  assert.equal(result.areaSqm, 90);
  assert.equal(result.priceEgp, 1_500_000);
});

test('rejects an invalid propertyType', () => {
  assert.throws(() => validateListingInput({ ...VALID_INPUT, propertyType: 'castle' }), InvalidListingInputError);
});

test('rejects non-positive or non-integer area/price', () => {
  assert.throws(() => validateListingInput({ ...VALID_INPUT, areaSqm: 0 }), InvalidListingInputError);
  assert.throws(() => validateListingInput({ ...VALID_INPUT, areaSqm: 12.5 }), InvalidListingInputError);
  assert.throws(() => validateListingInput({ ...VALID_INPUT, priceEgp: -1 }), InvalidListingInputError);
});

test('rejects empty or missing text fields', () => {
  assert.throws(() => validateListingInput({ ...VALID_INPUT, title: '   ' }), InvalidListingInputError);
  assert.throws(() => validateListingInput({ ...VALID_INPUT, description: undefined }), InvalidListingInputError);
});
