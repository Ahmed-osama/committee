import { createHmac, randomUUID } from 'node:crypto';
import type { CheckoutSession, CreditPackage, PaymentProvider, PaymentWebhookEvent } from './payment.js';

// TODO(human): replace with a real PaymobPaymentProvider once the founder has a
// Paymob merchant account and API credentials (see docs/projects/groundtruth.md's
// post-round-5 correction on why Paymob, not Stripe). This mock signs/verifies
// webhook payloads with a fixed dev-only secret so the signature-verification code
// path in apps/web is real and exercised, not just always-trusted — a real adapter
// must verify Paymob's own HMAC scheme instead.
const MOCK_WEBHOOK_SECRET = 'mock-paymob-webhook-secret-dev-only';

function sign(rawBody: string): string {
  return createHmac('sha256', MOCK_WEBHOOK_SECRET).update(rawBody).digest('hex');
}

export class MockPaymentProvider implements PaymentProvider {
  async createCheckout(_input: { userId: string; creditPackage: CreditPackage }): Promise<CheckoutSession> {
    const providerReference = randomUUID();
    return {
      providerReference,
      // Points at apps/web's own dev-only "simulate payment" page rather than a real
      // hosted checkout — see that page's comment for why it can only exist while
      // this mock is the active provider.
      checkoutUrl: `/credits/mock-checkout/${providerReference}`,
    };
  }

  // Not part of the PaymentProvider interface — a real vendor's webhook is signed by
  // their server, never by this app. Exists only so apps/web's mock checkout page can
  // construct a validly-signed payload to simulate what Paymob would send.
  signWebhookPayload(rawBody: string): string {
    return sign(rawBody);
  }

  parseWebhookEvent(rawBody: string, signatureHeader: string): PaymentWebhookEvent | null {
    if (!signatureHeader || sign(rawBody) !== signatureHeader) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawBody) as { providerReference?: unknown; status?: unknown };
      if (typeof parsed.providerReference !== 'string' || (parsed.status !== 'succeeded' && parsed.status !== 'failed')) {
        return null;
      }
      return { providerReference: parsed.providerReference, status: parsed.status };
    } catch {
      return null;
    }
  }
}
