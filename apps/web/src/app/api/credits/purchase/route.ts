import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import { startCreditPurchase, UnknownCreditPackageError } from '@/lib/payments/credits';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { packageId?: unknown } | null;
  if (typeof body?.packageId !== 'string') {
    return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
  }

  try {
    const checkout = await startCreditPurchase(session.userId, body.packageId);
    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    if (error instanceof UnknownCreditPackageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
