import { cookies } from 'next/headers';
import { createSessionToken, requireSessionSecret, verifySessionToken } from '@/lib/auth/session';
import type { SessionPayload } from '@/lib/auth/session';

const SESSION_COOKIE = 'gt_session';

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = createSessionToken(payload, requireSessionSecret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token, requireSessionSecret());
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Admin role gating (COM-18): a simple role-column check, used by any admin-only
// route — COM-24's moderation dashboard is the first real consumer. There is no
// self-serve path to the 'admin' role; promoting a user is a manual DB update until
// an invite flow exists, which is intentionally out of MVP scope.
export async function requireAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  return session?.role === 'admin' ? session : null;
}
