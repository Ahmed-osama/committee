import type { CreditPackage } from '@committee/payment-providers';

// Product/pricing config lives here, not in @committee/payment-providers — that
// package is vendor-agnostic and shouldn't know GroundTruth's actual price points.
// Placeholder EGP prices pending real market-testing; a human should revisit these
// before launch, not treat them as final.
export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  { id: 'starter', credits: 5, priceEgp: 50 },
  { id: 'standard', credits: 20, priceEgp: 150 },
];

export function findCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === packageId);
}

// Flat cost for revealing one listing's seller contact info — see
// docs/projects/groundtruth.md's MVP scope (pay-to-reveal-contact). A single fixed
// cost keeps the paywall simple (root CLAUDE.md's "keep flows shallow" constraint);
// per-listing/tiered pricing is a possible follow-up, not attempted here.
export const REVEAL_COST_CREDITS = 1;
