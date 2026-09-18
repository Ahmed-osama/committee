'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { confirmDeal } from '@/lib/deals/deals';

export async function confirmDealAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const dealId = formData.get('dealId');
  if (typeof dealId !== 'string') {
    throw new Error('dealId is required');
  }

  await confirmDeal(session.userId, dealId);
  redirect(`/deals/${dealId}`);
}
