import { NextResponse } from 'next/server';
import { InvalidPhoneError, requestOtp } from '@/lib/auth/otp-flow';

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const phone = typeof body === 'object' && body !== null && 'phone' in body ? (body as { phone: unknown }).phone : null;

  if (typeof phone !== 'string') {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  try {
    const { requestId } = await requestOtp(phone);
    return NextResponse.json({ requestId });
  } catch (error) {
    if (error instanceof InvalidPhoneError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
