// Pure anti-gaming heuristics (no DB access) for COM-24's moderation dashboard —
// see docs/projects/groundtruth.md's anti-collusion mechanism: these target the two
// concrete gaming vectors the platform's own structure can't rule out by
// construction (unlike KYC/OTP, which rules out sockpuppets at signup time).
// Thresholds are starting points pending real usage data, not final tuning.

// A buyer opening many negotiation threads that never convert to a closed deal is
// the shape a broker "testing the market" with fabricated buyer interest — or a
// sockpuppet account inflating apparent demand — would take.
export const SUSPICIOUS_NEGOTIATION_COUNT_THRESHOLD = 5;

export function isHighActivityNoClose(negotiationCount: number, closedDealCount: number): boolean {
  return negotiationCount >= SUSPICIOUS_NEGOTIATION_COUNT_THRESHOLD && closedDealCount === 0;
}

// A closed deal priced far from its (zone, type, area-band) valuation cell is the
// shape a fabricated deal (inflating or deflating the valuation signal itself) would
// take — only meaningful once a cell has an established valuation (COM-23), so this
// is never applied against a cell with fewer than MIN_DEALS_FOR_VALUATION deals.
export const PRICE_OUTLIER_RATIO = 0.5;

export function isPriceOutlier(dealPricePerSqmEgp: number, cellAvgPricePerSqmEgp: number, ratio: number = PRICE_OUTLIER_RATIO): boolean {
  if (cellAvgPricePerSqmEgp <= 0) {
    return false;
  }
  const deviation = Math.abs(dealPricePerSqmEgp - cellAvgPricePerSqmEgp) / cellAvgPricePerSqmEgp;
  return deviation > ratio;
}
