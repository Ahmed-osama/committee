import { MockPaymentProvider } from '@committee/payment-providers';
import type { PaymentProvider } from '@committee/payment-providers';

// Module-level singleton, currently @committee/payment-providers' mock — the one
// place a real Paymob adapter gets swapped in once the founder has a merchant
// account and credentials (see docs/projects/groundtruth.md). Nothing else in
// apps/web should import @committee/payment-providers directly, mirroring
// src/lib/auth/providers.ts's pattern for COM-18's OTP/KYC providers.
export const paymentProvider: PaymentProvider = new MockPaymentProvider();
