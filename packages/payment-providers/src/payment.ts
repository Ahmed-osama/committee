// Vendor-agnostic payment interface. COM-21 codes against this, not a specific
// vendor SDK — Paymob is the confirmed choice for GroundTruth (see
// docs/projects/groundtruth.md's post-round-5 corrections: Stripe was ruled out for
// an Egypt-based business without a foreign entity). A real adapter (e.g.
// `PaymobPaymentProvider`) lands in this package as a sibling file once the founder
// has a real Paymob merchant account and API credentials.
export type CreditPackage = {
  id: string;
  credits: number;
  priceEgp: number;
};

export type CheckoutSession = {
  providerReference: string;
  // A real adapter returns Paymob's hosted iframe/unified-checkout URL here.
  checkoutUrl: string;
};

export type PaymentWebhookEvent = {
  providerReference: string;
  status: 'succeeded' | 'failed';
};

export interface PaymentProvider {
  createCheckout(input: { userId: string; creditPackage: CreditPackage }): Promise<CheckoutSession>;
  // Verifies the webhook's authenticity (Paymob signs callbacks with an HMAC over a
  // vendor-specific concatenation of fields — see their webhook docs) and parses it
  // into a normalized event. Must return null rather than throw on a failed/missing
  // signature, so a caller can't accidentally treat an unverified body as trusted.
  parseWebhookEvent(rawBody: string, signatureHeader: string): PaymentWebhookEvent | null;
}
