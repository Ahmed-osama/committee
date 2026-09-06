import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import {
  CannotRevealOwnListingError,
  InsufficientCreditsError,
  ListingNotFoundError,
  revealSellerContact,
} from '@/lib/payments/credits';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const { id: listingId } = await params;

  try {
    const result = await revealSellerContact(session.userId, listingId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof CannotRevealOwnListingError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }
}
