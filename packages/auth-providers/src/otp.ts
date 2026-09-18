// Vendor-agnostic OTP interface. COM-18 (auth) codes against this, not a specific
// vendor SDK, so the pick in docs/projects/groundtruth-vendor-spike.md (currently
// unconfirmed — Twilio Verify is the lead candidate) can change without touching
// apps/web. A real adapter (e.g. `TwilioVerifyOtpProvider`) lands in this package
// as a sibling file once the founder confirms a vendor and credentials exist.
export type OtpSendResult = {
  requestId: string;
};

export type OtpCheckResult = {
  verified: boolean;
};

export interface OtpProvider {
  // `phoneE164` must already be in E.164 form (e.g. "+201234567890") — validating
  // and normalizing raw user input into E.164 is the caller's job, not the provider's.
  sendOtp(phoneE164: string): Promise<OtpSendResult>;
  checkOtp(phoneE164: string, requestId: string, code: string): Promise<OtpCheckResult>;
}
