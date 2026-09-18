import { getLatestKycStatus } from './kyc-flow';

export class SellerNotKycApprovedError extends Error {}

// COM-17's listing creation must never be reachable by an unauthenticated or
// unverified account — an anonymous/un-KYC'd seller is exactly the collusion vector
// (fabricated listings/accounts) the KYC+OTP stack (COM-18) exists to close. See
// docs/projects/groundtruth.md's anti-collusion mechanism.
export async function requireKycApprovedSeller(userId: string): Promise<void> {
  const latest = await getLatestKycStatus(userId);
  if (latest?.status !== 'approved') {
    throw new SellerNotKycApprovedError('seller must have an approved KYC verification');
  }
}
