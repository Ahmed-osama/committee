import { NextResponse } from 'next/server';
import { getSession } from '@/app/api/_lib/session';
import {
  InvalidCounterPriceError,
  NegotiationNotOpenError,
  NotYourTurnError,
} from '@/lib/negotiations/state-machine';
import { NegotiationNotFoundError, NotNegotiationPartyError, respondToNegotiation } from '@/lib/negotiations/negotiations';
import type { NegotiationAction } from '@/lib/negotiations/state-machine';

const VALID_ACTIONS: NegotiationAction[] = ['counter', 'accept', 'reject'];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'authentication required' }, { status: 401 });
  }

  const { id: negotiationId } = await params;
  const body = (await request.json().catch(() => null)) as { action?: unknown; counterPriceEgp?: unknown } | null;
  const action = body?.action;
  if (typeof action !== 'string' || !VALID_ACTIONS.includes(action as NegotiationAction)) {
    return NextResponse.json({ error: `action must be one of: ${VALID_ACTIONS.join(', ')}` }, { status: 400 });
  }
  const counterPriceEgp =
    typeof body?.counterPriceEgp === 'string' ? Number(body.counterPriceEgp) : (body?.counterPriceEgp as number | undefined);

  try {
    const negotiation = await respondToNegotiation(session.userId, negotiationId, action as NegotiationAction, counterPriceEgp);
    return NextResponse.json(negotiation);
  } catch (error) {
    if (error instanceof NegotiationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof NotNegotiationPartyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotYourTurnError || error instanceof NegotiationNotOpenError || error instanceof InvalidCounterPriceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
