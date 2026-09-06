import { db, listingPhotos, listings } from '@committee/db';
import { and, desc, eq } from 'drizzle-orm';
import { requireKycApprovedSeller } from '../auth/require-seller';
import type { ListingInput, ListingType } from './validation';

export async function createListing(sellerId: string, input: ListingInput) {
  await requireKycApprovedSeller(sellerId);

  const [row] = await db
    .insert(listings)
    .values({ sellerId, ...input })
    .returning();
  return row;
}

// Public browse — no auth required (see docs/projects/groundtruth.md: browsing itself
// doesn't require login, consistent with the public anonymized deal feed philosophy).
// Only 'active' listings are browsable; an archived listing is only reachable by its
// seller (not built yet — no seller dashboard in this issue's scope).
export async function listActiveListings(filters?: { zone?: string; propertyType?: ListingType }) {
  const conditions = [eq(listings.status, 'active')];
  if (filters?.zone) {
    conditions.push(eq(listings.zone, filters.zone));
  }
  if (filters?.propertyType) {
    conditions.push(eq(listings.propertyType, filters.propertyType));
  }

  return db
    .select()
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt));
}

export async function getListingWithPhotos(listingId: string) {
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) {
    return null;
  }

  const photos = await db
    .select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(listingPhotos.sortOrder);

  return { listing, photos };
}

export class NotListingOwnerError extends Error {}

export async function addListingPhoto(listingId: string, sellerId: string, url: string, sortOrder: number) {
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing || listing.sellerId !== sellerId) {
    throw new NotListingOwnerError('listing not found or not owned by this seller');
  }

  const [row] = await db.insert(listingPhotos).values({ listingId, url, sortOrder }).returning();
  return row;
}
