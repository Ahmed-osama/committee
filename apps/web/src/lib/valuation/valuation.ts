import { areaBandFor } from './bands';

// COM-23's core anti-gaming rule: a (zone, type, area-band) cell is suppressed
// entirely — not shown with a "not enough data" placeholder, just absent — until at
// least this many real, organic, dual-confirmed deals (COM-20) exist for it. No
// synthetic seed data ever (see docs/projects/groundtruth.md). 3 is a starting
// threshold; a human should revisit it once real deal volume exists, not treat it as
// final.
export const MIN_DEALS_FOR_VALUATION = 3;

export type ClosedDealSample = {
  zone: string;
  propertyType: string;
  areaSqm: number;
  priceEgp: number;
};

export type ValuationCell = {
  zone: string;
  propertyType: string;
  areaBand: string;
  dealCount: number;
  avgPricePerSqmEgp: number;
};

// Pure aggregation (no DB access) so the suppression threshold and the
// price-per-sqm math are cheap to unit test — this is the one place COM-23's
// "no badge until it's earned" rule is actually enforced, so it needs to be
// unambiguously correct.
export function computeValuationCells(
  samples: ClosedDealSample[],
  minDeals: number = MIN_DEALS_FOR_VALUATION,
): ValuationCell[] {
  const groups = new Map<
    string,
    {
      zone: string;
      propertyType: string;
      areaBand: string;
      totalPricePerSqm: number;
      count: number;
    }
  >();

  for (const sample of samples) {
    const areaBand = areaBandFor(sample.areaSqm);
    const key = `${sample.zone}\0${sample.propertyType}\0${areaBand}`;
    const pricePerSqm = sample.priceEgp / sample.areaSqm;
    const existing = groups.get(key);
    if (existing) {
      existing.totalPricePerSqm += pricePerSqm;
      existing.count += 1;
    } else {
      groups.set(key, {
        zone: sample.zone,
        propertyType: sample.propertyType,
        areaBand,
        totalPricePerSqm: pricePerSqm,
        count: 1,
      });
    }
  }

  return Array.from(groups.values())
    .filter((group) => group.count >= minDeals)
    .map((group) => ({
      zone: group.zone,
      propertyType: group.propertyType,
      areaBand: group.areaBand,
      dealCount: group.count,
      avgPricePerSqmEgp: Math.round(group.totalPricePerSqm / group.count),
    }));
}

export function findValuationForListing(
  cells: ValuationCell[],
  zone: string,
  propertyType: string,
  areaSqm: number,
): ValuationCell | null {
  const areaBand = areaBandFor(areaSqm);
  return (
    cells.find(
      (cell) =>
        cell.zone === zone && cell.propertyType === propertyType && cell.areaBand === areaBand,
    ) ?? null
  );
}
