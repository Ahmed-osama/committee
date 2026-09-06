import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { getNegotiationWithEvents } from '@/lib/negotiations/negotiations';
import { respondToNegotiationAction } from './actions';

// Direct DB query, no DB at build time in this repo — see listings/page.tsx's comment.
export const dynamic = 'force-dynamic';

export default async function NegotiationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('Negotiations');
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const result = await getNegotiationWithEvents(id);
  if (!result) {
    notFound();
  }
  const { negotiation, events } = result;

  const isBuyer = session.userId === negotiation.buyerId;
  const isSeller = session.userId === negotiation.sellerId;
  if (!isBuyer && !isSeller) {
    notFound();
  }

  const myTurn = negotiation.status === 'open' && ((isBuyer && negotiation.turn === 'buyer') || (isSeller && negotiation.turn === 'seller'));

  return (
    <main>
      <h1>{t('threadTitle')}</h1>
      <p>
        {t('statusLabel')}: {t(`status.${negotiation.status}`)}
      </p>
      <p>
        {t('currentPriceLabel')}: {negotiation.currentPriceEgp.toLocaleString()} EGP
      </p>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {t(`event.${event.type}`)}
            {event.priceEgp != null ? ` — ${event.priceEgp.toLocaleString()} EGP` : ''}
          </li>
        ))}
      </ul>
      {myTurn ? (
        <>
          <form action={respondToNegotiationAction}>
            <input type="hidden" name="negotiationId" value={negotiation.id} />
            <input type="hidden" name="action" value="accept" />
            <button type="submit">{t('accept')}</button>
          </form>
          <form action={respondToNegotiationAction}>
            <input type="hidden" name="negotiationId" value={negotiation.id} />
            <input type="hidden" name="action" value="reject" />
            <button type="submit">{t('reject')}</button>
          </form>
          <form action={respondToNegotiationAction}>
            <input type="hidden" name="negotiationId" value={negotiation.id} />
            <input type="hidden" name="action" value="counter" />
            <label>
              {t('counterPriceLabel')}
              <input type="number" name="counterPriceEgp" required min={1} step={1} />
            </label>
            <button type="submit">{t('counter')}</button>
          </form>
        </>
      ) : negotiation.status === 'open' ? (
        <p>{t('waitingOnOtherParty')}</p>
      ) : null}
    </main>
  );
}
