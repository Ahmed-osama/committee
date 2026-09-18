import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import { SellerNotKycApprovedError } from '@/lib/auth/require-seller';
import { createListing } from '@/lib/listings/listings';
import { InvalidListingInputError, validateListingInput } from '@/lib/listings/validation';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);

  try {
    const input = validateListingInput((body ?? {}) as Record<string, unknown>);
    const listing = await createListing(session.userId, input);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidListingInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SellerNotKycApprovedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
