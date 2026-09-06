'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { startCreditPurchase } from '@/lib/payments/credits';

export async function purchaseCreditsAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const packageId = formData.get('packageId');
  if (typeof packageId !== 'string') {
    throw new Error('packageId is required');
  }

  const checkout = await startCreditPurchase(session.userId, packageId);
  redirect(checkout.checkoutUrl);
}
