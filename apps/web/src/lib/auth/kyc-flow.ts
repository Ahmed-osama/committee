import { db, kycVerifications } from '@committee/db';
import { desc, eq } from 'drizzle-orm';
import { isEgyptianNationalId } from './national-id';
import { kycProvider } from './providers';

export class InvalidNationalIdError extends Error {}

export type KycSubmissionInput = {
  userId: string;
  documentUrl: string;
  selfieUrl: string;
  nationalIdNumber: string;
};

export async function submitKyc(input: KycSubmissionInput) {
  if (!isEgyptianNationalId(input.nationalIdNumber)) {
    throw new InvalidNationalIdError('nationalIdNumber must be a 14-digit Egyptian national ID');
  }

  const { verificationId } = await kycProvider.submitVerification({
    userId: input.userId,
    documentImage: { url: input.documentUrl },
    selfieImage: { url: input.selfieUrl },
    nationalIdNumber: input.nationalIdNumber,
  });

  // The mock provider (packages/auth-providers) resolves to 'approved' immediately;
  // a real vendor is async, so this status read is a stand-in for what will become a
  // webhook-driven update once a real KycProvider adapter exists.
  const { status, reason } = await kycProvider.getVerificationStatus(verificationId);

  const [row] = await db
    .insert(kycVerifications)
    .values({
      userId: input.userId,
      documentUrl: input.documentUrl,
      selfieUrl: input.selfieUrl,
      nationalIdNumber: input.nationalIdNumber,
      providerVerificationId: verificationId,
      status,
      rejectionReason: reason,
    })
    .returning();

  return row;
}

export async function getLatestKycStatus(userId: string) {
  const [row] = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId))
    .orderBy(desc(kycVerifications.createdAt))
    .limit(1);
  return row ?? null;
}
