'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { revealSellerContact } from '@/lib/payments/credits';

// Errors (insufficient credits, own listing) surface via Next's default error
// boundary today — same known gap as create-listing's Server Action (COM-17).
export async function revealContactAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const listingId = formData.get('listingId');
  if (typeof listingId !== 'string') {
    throw new Error('listingId is required');
  }

  await revealSellerContact(session.userId, listingId);
}
