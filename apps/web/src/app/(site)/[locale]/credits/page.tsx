import { getTranslations } from 'next-intl/server';
import { getSession } from '@/app/api/_lib/session';
import { CREDIT_PACKAGES } from '@/lib/payments/packages';
import { getCreditBalance } from '@/lib/payments/credits';
import { purchaseCreditsAction } from './actions';

// Direct DB query, no DB at build time in this repo — see listings/page.tsx's comment.
export const dynamic = 'force-dynamic';

export default async function CreditsPage() {
  const t = await getTranslations('Credits');
  const session = await getSession();

  if (!session) {
    return (
      <main>
        <h1>{t('title')}</h1>
        <p>{t('signInRequired')}</p>
      </main>
    );
  }

  const balance = await getCreditBalance(session.userId);

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>
        {t('balanceLabel')}: {balance}
      </p>
      <ul>
        {CREDIT_PACKAGES.map((creditPackage) => (
          <li key={creditPackage.id}>
            {creditPackage.credits} {t('creditsUnit')} — {creditPackage.priceEgp.toLocaleString()} EGP
            <form action={purchaseCreditsAction}>
              <input type="hidden" name="packageId" value={creditPackage.id} />
              <button type="submit">{t('buy')}</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
