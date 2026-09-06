import { kycVerifications, otpRequests, pooledDb, users } from '@committee/db';
import { eq } from 'drizzle-orm';

// Data-deletion-rights flow: hard-deletes a user's account and everything tied to it.
// `kyc_verifications` cascades via its FK, but `otp_requests` has no FK to `users`
// (it's keyed by phone, from before a user row exists), so this needs an explicit
// multi-statement transaction to guarantee the phone's OTP history and the user row
// disappear together — exactly the "hold a lock across statements" case
// packages/db/CLAUDE.md flags neon-http (`db`) as unable to do, hence `pooledDb` here.
export async function deleteAccount(userId: string): Promise<void> {
  await pooledDb.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return;
    }

    await tx.delete(otpRequests).where(eq(otpRequests.phone, user.phone));
    await tx.delete(kycVerifications).where(eq(kycVerifications.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
}
