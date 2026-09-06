'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { createListing } from '@/lib/listings/listings';
import { validateListingInput } from '@/lib/listings/validation';

export async function createListingAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const input = validateListingInput({
    title: formData.get('title'),
    description: formData.get('description'),
    zone: formData.get('zone'),
    propertyType: formData.get('propertyType'),
    areaSqm: formData.get('areaSqm'),
    priceEgp: formData.get('priceEgp'),
  });

  const listing = await createListing(session.userId, input);
  if (listing) {
    redirect(`/listings/${listing.id}`);
  }
}
