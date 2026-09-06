import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/app/api/_lib/session';
import { deleteAccount } from '@/lib/auth/delete-account';

// Data-deletion-rights endpoint (COM-18): hard-deletes the authenticated user's
// account and everything tied to it. No confirmation step here beyond requiring an
// authenticated session — a confirmation UI is apps/web's job (COM-25/UX polish), not
// this endpoint's.
export async function POST(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  await deleteAccount(session.userId);
  await clearSessionCookie();
  return NextResponse.json({ deleted: true });
}
