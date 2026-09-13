'use server';

import { redirect } from 'next/navigation';
import { MockPaymentProvider } from '@committee/payment-providers';
import { handlePaymentWebhook } from '@/lib/payments/credits';

// This page/action only exists because @committee/payment-providers' mock is the
// active provider (see lib/payments/providers.ts) — there is no real hosted checkout
// to redirect to yet. Delete this route entirely once a real Paymob adapter replaces
// the mock; a real vendor's webhook always arrives server-to-server, never through a
// page a buyer's own browser can trigger like this.
const mockProvider = new MockPaymentProvider();

export async function simulatePaymentAction(formData: FormData): Promise<void> {
  const providerReference = formData.get('providerReference');
  const outcome = formData.get('outcome');
  if (typeof providerReference !== 'string' || (outcome !== 'succeeded' && outcome !== 'failed')) {
    throw new Error('providerReference and a valid outcome are required');
  }

  const rawBody = JSON.stringify({ providerReference, status: outcome });
  const signature = mockProvider.signWebhookPayload(rawBody);
  await handlePaymentWebhook(rawBody, signature);
  redirect('/credits');
}
