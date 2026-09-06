import { db, otpRequests, users } from '@committee/db';
import { eq } from 'drizzle-orm';
import { isEgyptianE164Phone } from './phone';
import { otpProvider } from './providers';
import type { SessionPayload } from './session';

export class InvalidPhoneError extends Error {}
export class InvalidOtpRequestError extends Error {}
export class IncorrectOtpError extends Error {}

export async function requestOtp(phone: string): Promise<{ requestId: string }> {
  if (!isEgyptianE164Phone(phone)) {
    throw new InvalidPhoneError('phone must be a valid Egyptian E.164 number (e.g. +201001234567)');
  }

  const { requestId } = await otpProvider.sendOtp(phone);
  await db.insert(otpRequests).values({ id: requestId, phone });
  return { requestId };
}

// Registration and login are the same flow: a verified phone number either matches
// an existing user (login) or creates one (registration) — there's no separate signup
// step, consistent with "keep flows shallow" in docs/projects/groundtruth.md.
export async function verifyOtp(requestId: string, code: string): Promise<SessionPayload> {
  const [pending] = await db.select().from(otpRequests).where(eq(otpRequests.id, requestId)).limit(1);
  if (!pending || pending.consumedAt) {
    throw new InvalidOtpRequestError('no pending OTP request for this requestId');
  }

  const { verified } = await otpProvider.checkOtp(pending.phone, requestId, code);
  if (!verified) {
    throw new IncorrectOtpError('incorrect or expired code');
  }

  await db.update(otpRequests).set({ consumedAt: new Date() }).where(eq(otpRequests.id, requestId));

  const [existingUser] = await db.select().from(users).where(eq(users.phone, pending.phone)).limit(1);
  if (existingUser) {
    return { userId: existingUser.id, role: existingUser.role };
  }

  const [newUser] = await db.insert(users).values({ phone: pending.phone }).returning();
  if (!newUser) {
    throw new Error('failed to create user');
  }
  return { userId: newUser.id, role: newUser.role };
}
