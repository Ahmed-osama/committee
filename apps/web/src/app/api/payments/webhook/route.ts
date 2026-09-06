import { NextResponse } from 'next/server';
import { handlePaymentWebhook, InvalidWebhookSignatureError, PurchaseNotFoundError } from '@/lib/payments/credits';

// TODO(human): confirm Paymob's actual webhook signature header name/scheme once a
// real merchant account exists — this placeholder header name is a stand-in, not a
// verified vendor detail. No session/cookie auth here on purpose: a webhook is
// server-to-server, authenticated entirely by the signature.
const SIGNATURE_HEADER = 'x-paymob-signature';

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);

  try {
    const purchase = await handlePaymentWebhook(rawBody, signature);
    return NextResponse.json(purchase);
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof PurchaseNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
