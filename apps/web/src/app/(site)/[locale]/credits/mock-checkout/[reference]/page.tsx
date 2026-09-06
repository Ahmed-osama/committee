import { getTranslations } from 'next-intl/server';
import { simulatePaymentAction } from './actions';

// Dev-only stand-in for Paymob's real hosted checkout page — see actions.ts's
// comment. Never reachable in production once a real PaymentProvider replaces the
// mock (its checkoutUrl won't point here).
export default async function MockCheckoutPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const t = await getTranslations('Credits');

  return (
    <main>
      <h1>{t('mockCheckoutTitle')}</h1>
      <p>{t('mockCheckoutNotice')}</p>
      <form action={simulatePaymentAction}>
        <input type="hidden" name="providerReference" value={reference} />
        <input type="hidden" name="outcome" value="succeeded" />
        <button type="submit">{t('simulateSuccess')}</button>
      </form>
      <form action={simulatePaymentAction}>
        <input type="hidden" name="providerReference" value={reference} />
        <input type="hidden" name="outcome" value="failed" />
        <button type="submit">{t('simulateFailure')}</button>
      </form>
    </main>
  );
}
