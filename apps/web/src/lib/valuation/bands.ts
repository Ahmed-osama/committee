// Area-band bucketing for COM-23's valuation engine. A fixed 100 sqm band width
// keeps this simple (root CLAUDE.md's "keep flows shallow" constraint extends to the
// data model, not just UI) — a variable/adaptive band width is a possible follow-up
// once there's enough deal volume to make it worth the complexity.
export const AREA_BAND_SIZE_SQM = 100;

// areaSqm is always a positive whole number (see lib/listings/validation.ts), so
// band boundaries are inclusive-low/exclusive-high in whole-band terms: 1-100 sqm is
// one band, 101-200 sqm the next, etc. — never split by an exact multiple of the
// band size landing on a boundary.
export function areaBandFor(areaSqm: number): string {
  const start = Math.floor((areaSqm - 1) / AREA_BAND_SIZE_SQM) * AREA_BAND_SIZE_SQM;
  return `${start}-${start + AREA_BAND_SIZE_SQM}`;
}
