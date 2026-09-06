import { randomUUID } from 'node:crypto';
import type { KycProvider, KycStatusResult, KycSubmission, KycSubmissionResult } from './kyc.js';
import type { OtpCheckResult, OtpProvider, OtpSendResult } from './otp.js';

// TODO(human): replace with a real vendor adapter (Twilio Verify per the COM-15
// spike) once the founder confirms a vendor and API credentials exist. This mock
// exists so COM-18's auth flow has something to run against locally and in CI
// without a live OTP vendor.
const MOCK_OTP_CODE = '000000';

export class MockOtpProvider implements OtpProvider {
  private readonly pendingByRequestId = new Map<string, string>();

  async sendOtp(phoneE164: string): Promise<OtpSendResult> {
    const requestId = randomUUID();
    this.pendingByRequestId.set(requestId, phoneE164);
    return { requestId };
  }

  async checkOtp(phoneE164: string, requestId: string, code: string): Promise<OtpCheckResult> {
    const sentTo = this.pendingByRequestId.get(requestId);
    return { verified: sentTo === phoneE164 && code === MOCK_OTP_CODE };
  }
}

// TODO(human): replace with a real vendor adapter (Sumsub per the COM-15 spike)
// once the founder confirms a vendor and API credentials exist. This mock always
// approves after one status check, which is deliberately unrealistic — COM-18's
// tests should not assume real vendor turnaround times or rejection behavior.
export class MockKycProvider implements KycProvider {
  private readonly statusByVerificationId = new Map<string, KycStatusResult>();

  async submitVerification(_input: KycSubmission): Promise<KycSubmissionResult> {
    const verificationId = randomUUID();
    this.statusByVerificationId.set(verificationId, { status: 'approved' });
    return { verificationId };
  }

  async getVerificationStatus(verificationId: string): Promise<KycStatusResult> {
    return this.statusByVerificationId.get(verificationId) ?? { status: 'pending' };
  }
}
