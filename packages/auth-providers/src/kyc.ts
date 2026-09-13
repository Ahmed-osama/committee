// Vendor-agnostic KYC interface. COM-18 codes against this, not a specific vendor
// SDK — see docs/projects/groundtruth-vendor-spike.md (Sumsub is the lead
// candidate, unconfirmed) for the research behind the eventual pick. A real
// adapter (e.g. `SumsubKycProvider`) lands in this package as a sibling file once
// the founder confirms a vendor and credentials exist.
export type KycImageRef = {
  // Wherever COM-18's upload flow stores the file (object storage URL, not raw
  // bytes) — this package never touches file bytes directly.
  url: string;
};

export type KycSubmission = {
  userId: string;
  documentImage: KycImageRef;
  selfieImage: KycImageRef;
  nationalIdNumber: string;
};

export type KycSubmissionResult = {
  verificationId: string;
};

export type KycStatus = 'pending' | 'approved' | 'rejected';

export type KycStatusResult = {
  status: KycStatus;
  // Present only when status is 'rejected'; vendor-supplied human-readable reason.
  reason?: string;
};

export interface KycProvider {
  submitVerification(input: KycSubmission): Promise<KycSubmissionResult>;
  getVerificationStatus(verificationId: string): Promise<KycStatusResult>;
}
