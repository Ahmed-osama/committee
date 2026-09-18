import { getTranslations } from 'next-intl/server';
import { getSession } from '@/app/api/_lib/session';
import { getLatestKycStatus } from '@/lib/auth/kyc-flow';
import { BigLinkButton } from '@/components/big-button';
import { PageShell } from '@/components/page-shell';
import { KycForm } from './kyc-form';

// COM-18 shipped a working /api/kyc/submit + private storage bucket but no page
// that could reach them, which made COM-17's listing creation an unreachable dead
// end for every real user (kyc.status is never anything but null). This page is
// that missing piece.
export default async function KycPage() {
  const t = await getTranslations('Kyc');
  const session = await getSession();

  if (!session) {
    return (
      <PageShell>
        <h1 className="mb-4 text-xl font-extrabold">{t('title')}</h1>
        <p>{t('signInRequired')}</p>
      </PageShell>
    );
  }

  const kyc = await getLatestKycStatus(session.userId);

  if (kyc?.status === 'approved') {
    return (
      <PageShell>
        <h1 className="mb-4 text-xl font-extrabold">{t('title')}</h1>
        <p className="mb-6">{t('approved')}</p>
        <BigLinkButton href="/listings/new">{t('goToListing')}</BigLinkButton>
      </PageShell>
    );
  }

  if (kyc?.status === 'pending') {
    return (
      <PageShell>
        <h1 className="mb-4 text-xl font-extrabold">{t('title')}</h1>
        <p>{t('pending')}</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-extrabold">{t('title')}</h1>
      <p className="mb-6 text-sm text-muted">{t('subtitle')}</p>
      {kyc?.status === 'rejected' ? (
        <p role="alert" className="mb-6 text-base font-medium text-red-700">
          {kyc.rejectionReason
            ? t('rejectedWithReason', { reason: kyc.rejectionReason })
            : t('rejected')}
        </p>
      ) : null}
      <KycForm />
    </PageShell>
  );
}
