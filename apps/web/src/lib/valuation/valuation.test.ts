import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeValuationCells, findValuationForListing, type ClosedDealSample } from './valuation';

function sample(overrides: Partial<ClosedDealSample> = {}): ClosedDealSample {
  return { zone: 'Zone A', propertyType: 'apartment', areaSqm: 100, priceEgp: 1_000_000, ...overrides };
}

test('a cell below the minimum deal count is suppressed entirely', () => {
  const cells = computeValuationCells([sample(), sample()], 3);
  assert.deepEqual(cells, []);
});

test('a cell reaching the minimum deal count is included with its average price/sqm', () => {
  const cells = computeValuationCells(
    [sample({ priceEgp: 1_000_000 }), sample({ priceEgp: 1_100_000 }), sample({ priceEgp: 1_200_000 })],
    3,
  );
  assert.equal(cells.length, 1);
  assert.equal(cells[0]?.dealCount, 3);
  // (10000 + 11000 + 12000) / 3 = 11000 EGP/sqm at areaSqm=100
  assert.equal(cells[0]?.avgPricePerSqmEgp, 11_000);
});

test('different zones/types/area-bands never mix into the same cell', () => {
  const cells = computeValuationCells(
    [
      sample({ zone: 'Zone A' }),
      sample({ zone: 'Zone A' }),
      sample({ zone: 'Zone A' }),
      sample({ zone: 'Zone B' }),
      sample({ zone: 'Zone B' }),
      sample({ zone: 'Zone B' }),
      sample({ propertyType: 'house' }),
      sample({ propertyType: 'house' }),
      sample({ propertyType: 'house' }),
      sample({ areaSqm: 250 }),
      sample({ areaSqm: 260 }),
      sample({ areaSqm: 270 }),
    ],
    3,
  );
  assert.equal(cells.length, 4);
});

test('an area just over a band boundary lands in the next band, not the same one', () => {
  const cells = computeValuationCells([sample({ areaSqm: 100 }), sample({ areaSqm: 100 }), sample({ areaSqm: 101 })], 3);
  // 2 deals at 1-100 sqm, 1 deal at 101-200 sqm — neither reaches the threshold of 3
  assert.deepEqual(cells, []);
});

test('findValuationForListing returns the matching cell or null when suppressed/absent', () => {
  const cells = computeValuationCells(
    [sample({ priceEgp: 1_000_000 }), sample({ priceEgp: 1_000_000 }), sample({ priceEgp: 1_000_000 })],
    3,
  );

  assert.notEqual(findValuationForListing(cells, 'Zone A', 'apartment', 100), null);
  assert.equal(findValuationForListing(cells, 'Zone A', 'apartment', 500), null);
  assert.equal(findValuationForListing(cells, 'Zone C', 'apartment', 100), null);
});
