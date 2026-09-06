import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/app/api/_lib/session';
import { IncorrectOtpError, InvalidOtpRequestError, verifyOtp } from '@/lib/auth/otp-flow';

type VerifyBody = { requestId: unknown; code: unknown };

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const { requestId, code } = (body ?? {}) as Partial<VerifyBody>;

  if (typeof requestId !== 'string' || typeof code !== 'string') {
    return NextResponse.json({ error: 'requestId and code are required' }, { status: 400 });
  }

  try {
    const session = await verifyOtp(requestId, code);
    await setSessionCookie(session);
    return NextResponse.json({ userId: session.userId, role: session.role });
  } catch (error) {
    if (error instanceof InvalidOtpRequestError || error instanceof IncorrectOtpError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
