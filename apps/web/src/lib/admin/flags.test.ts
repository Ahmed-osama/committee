import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isHighActivityNoClose, isPriceOutlier, PRICE_OUTLIER_RATIO, SUSPICIOUS_NEGOTIATION_COUNT_THRESHOLD } from './flags';

test('a buyer below the negotiation-count threshold is never flagged, even with zero closes', () => {
  assert.equal(isHighActivityNoClose(SUSPICIOUS_NEGOTIATION_COUNT_THRESHOLD - 1, 0), false);
});

test('a buyer at or above the threshold with zero closed deals is flagged', () => {
  assert.equal(isHighActivityNoClose(SUSPICIOUS_NEGOTIATION_COUNT_THRESHOLD, 0), true);
  assert.equal(isHighActivityNoClose(SUSPICIOUS_NEGOTIATION_COUNT_THRESHOLD + 10, 0), true);
});

test('a high-activity buyer with at least one closed deal is not flagged', () => {
  assert.equal(isHighActivityNoClose(SUSPICIOUS_NEGOTIATION_COUNT_THRESHOLD + 10, 1), false);
});

test('a deal within the outlier ratio of the cell average is not flagged', () => {
  assert.equal(isPriceOutlier(11_000, 10_000), false);
});

test('a deal beyond the outlier ratio of the cell average, in either direction, is flagged', () => {
  assert.equal(isPriceOutlier(20_000, 10_000), true);
  assert.equal(isPriceOutlier(4_000, 10_000), true);
});

test('a zero or negative cell average never flags (avoids a division-by-zero false positive)', () => {
  assert.equal(isPriceOutlier(10_000, 0), false);
});

test('the outlier ratio is configurable per call', () => {
  assert.equal(isPriceOutlier(12_000, 10_000, 0.5), false);
  assert.equal(isPriceOutlier(12_000, 10_000, 0.1), true);
  assert.notEqual(PRICE_OUTLIER_RATIO, undefined);
});
