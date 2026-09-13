'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { startNegotiation } from '@/lib/negotiations/negotiations';

export async function makeOfferAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const listingId = formData.get('listingId');
  const offerPriceEgp = Number(formData.get('offerPriceEgp'));
  if (typeof listingId !== 'string') {
    throw new Error('listingId is required');
  }

  const negotiation = await startNegotiation(session.userId, listingId, offerPriceEgp);
  redirect(`/negotiations/${negotiation.id}`);
}
