import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import {
  CannotNegotiateOwnListingError,
  InvalidOfferPriceError,
  ListingNotAvailableError,
  NegotiationAlreadyOpenError,
  startNegotiation,
} from '@/lib/negotiations/negotiations';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const { id: listingId } = await params;
  const body = (await request.json().catch(() => null)) as { offerPriceEgp?: unknown } | null;
  const offerPriceEgp = typeof body?.offerPriceEgp === 'string' ? Number(body.offerPriceEgp) : body?.offerPriceEgp;

  try {
    const negotiation = await startNegotiation(session.userId, listingId, offerPriceEgp as number);
    return NextResponse.json(negotiation, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidOfferPriceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ListingNotAvailableError || error instanceof CannotNegotiateOwnListingError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NegotiationAlreadyOpenError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
