export const LISTING_TYPES = ['apartment', 'house', 'land', 'commercial'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export function isListingType(value: unknown): value is ListingType {
  return typeof value === 'string' && (LISTING_TYPES as readonly string[]).includes(value);
}

export type ListingInput = {
  title: string;
  description: string;
  zone: string;
  propertyType: ListingType;
  areaSqm: number;
  priceEgp: number;
};

export class InvalidListingInputError extends Error {}

// Shape/range validation only — no DB access, so this is cheap to unit test and to
// reuse from both the create-listing Server Action and the API route.
export function validateListingInput(input: Record<string, unknown>): ListingInput {
  const { title, description, zone, propertyType, areaSqm, priceEgp } = input;

  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    throw new InvalidListingInputError('title is required (max 200 characters)');
  }
  if (typeof description !== 'string' || description.trim().length === 0 || description.length > 4000) {
    throw new InvalidListingInputError('description is required (max 4000 characters)');
  }
  if (typeof zone !== 'string' || zone.trim().length === 0 || zone.length > 100) {
    throw new InvalidListingInputError('zone is required (max 100 characters)');
  }
  if (!isListingType(propertyType)) {
    throw new InvalidListingInputError(`propertyType must be one of: ${LISTING_TYPES.join(', ')}`);
  }

  const area = typeof areaSqm === 'string' ? Number(areaSqm) : areaSqm;
  if (typeof area !== 'number' || !Number.isFinite(area) || !Number.isInteger(area) || area <= 0) {
    throw new InvalidListingInputError('areaSqm must be a positive whole number');
  }

  const price = typeof priceEgp === 'string' ? Number(priceEgp) : priceEgp;
  if (typeof price !== 'number' || !Number.isFinite(price) || !Number.isInteger(price) || price <= 0) {
    throw new InvalidListingInputError('priceEgp must be a positive whole number');
  }

  return {
    title: title.trim(),
    description: description.trim(),
    zone: zone.trim(),
    propertyType,
    areaSqm: area,
    priceEgp: price,
  };
}
