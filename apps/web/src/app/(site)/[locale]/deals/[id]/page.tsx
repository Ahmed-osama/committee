import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/app/api/_lib/session';
import { getDeal } from '@/lib/deals/deals';
import { confirmDealAction } from './actions';

// Direct DB query, no DB at build time in this repo — see listings/page.tsx's comment.
export const dynamic = 'force-dynamic';

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('Deals');
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const deal = await getDeal(id);
  if (!deal) {
    notFound();
  }

  const isBuyer = session.userId === deal.buyerId;
  const isSeller = session.userId === deal.sellerId;
  if (!isBuyer && !isSeller) {
    notFound();
  }

  const myConfirmedAt = isBuyer ? deal.buyerConfirmedAt : deal.sellerConfirmedAt;
  const otherConfirmedAt = isBuyer ? deal.sellerConfirmedAt : deal.buyerConfirmedAt;

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>
        {t('agreedPriceLabel')}: {deal.agreedPriceEgp.toLocaleString()} EGP
      </p>
      <p>
        {t('statusLabel')}: {t(`status.${deal.status}`)}
      </p>
      <p>{otherConfirmedAt ? t('otherPartyConfirmed') : t('otherPartyPending')}</p>
      {myConfirmedAt ? (
        <p>{t('youConfirmed')}</p>
      ) : (
        <form action={confirmDealAction}>
          <input type="hidden" name="dealId" value={deal.id} />
          <button type="submit">{t('confirm')}</button>
        </form>
      )}
    </main>
  );
}
