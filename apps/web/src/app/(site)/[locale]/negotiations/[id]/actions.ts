'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { respondToNegotiation } from '@/lib/negotiations/negotiations';
import type { NegotiationAction } from '@/lib/negotiations/state-machine';

export async function respondToNegotiationAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const negotiationId = formData.get('negotiationId');
  const action = formData.get('action');
  if (typeof negotiationId !== 'string' || typeof action !== 'string') {
    throw new Error('negotiationId and action are required');
  }

  const counterPriceEgpRaw = formData.get('counterPriceEgp');
  const counterPriceEgp = counterPriceEgpRaw ? Number(counterPriceEgpRaw) : undefined;

  await respondToNegotiation(session.userId, negotiationId, action as NegotiationAction, counterPriceEgp);
  redirect(`/negotiations/${negotiationId}`);
}
