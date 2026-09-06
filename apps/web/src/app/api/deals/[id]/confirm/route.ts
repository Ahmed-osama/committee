import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import { confirmDeal, DealNotFoundError, NotDealPartyError } from '@/lib/deals/deals';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
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
