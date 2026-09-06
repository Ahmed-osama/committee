import { MockKycProvider, MockOtpProvider } from '@committee/auth-providers';
import type { KycProvider, OtpProvider } from '@committee/auth-providers';

// TODO(human): swap these for real vendor adapters once the founder confirms a
// vendor per docs/projects/groundtruth-vendor-spike.md (Sumsub/Twilio Verify are the
// leads) — everything downstream codes against the KycProvider/OtpProvider
// interfaces, so this is the only place that needs to change.
//
// Module-level singletons: fine for MockOtpProvider's in-memory requestId bookkeeping
// as long as this runs as one long-lived process (local dev, a single server
// instance) — it will NOT survive across independent serverless invocations. A real
// vendor adapter has no such constraint since the vendor holds the state, not us.
export const otpProvider: OtpProvider = new MockOtpProvider();
export const kycProvider: KycProvider = new MockKycProvider();
