import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import { confirmDeal, DealNotFoundError, NotDealPartyError } from '@/lib/deals/deals';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }
  // COM-35: an operator-role session must never be able to confirm a deal on a
  // user's behalf, even incidentally — rejected outright here, not just via the
  // party check below (operator accounts aren't meant to transact at all).
  if (session.role === 'operator') {
    return NextResponse.json({ error: 'operator accounts cannot confirm deals' }, { status: 403 });
  }

  const { id: dealId } = await params;

  try {
    const deal = await confirmDeal(session.userId, dealId);
    return NextResponse.json(deal);
  } catch (error) {
    if (error instanceof DealNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof NotDealPartyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
