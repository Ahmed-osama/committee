import { getTranslations } from 'next-intl/server';
import { getSession } from '@/app/api/_lib/session';
import { getLatestKycStatus } from '@/lib/auth/kyc-flow';
import { LISTING_TYPES } from '@/lib/listings/validation';
import { createListingAction } from './actions';

// Errors from createListingAction (validation, KYC-not-approved) surface via Next's
// default error boundary today — a friendlier inline error is a UX follow-up, not
// blocking for COM-17's scope (getting a real, working, gated create flow in place).
export default async function NewListingPage() {
  const t = await getTranslations('Listings');
  const session = await getSession();

  if (!session) {
    return (
      <main>
        <h1>{t('createTitle')}</h1>
        <p>{t('signInToCreate')}</p>
      </main>
    );
  }

  const kyc = await getLatestKycStatus(session.userId);
  if (kyc?.status !== 'approved') {
    return (
      <main>
        <h1>{t('createTitle')}</h1>
        <p>{t('kycRequired')}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{t('createTitle')}</h1>
      <form action={createListingAction}>
        <label>
          {t('titleLabel')}
          <input type="text" name="title" required maxLength={200} />
        </label>
        <label>
          {t('descriptionLabel')}
          <textarea name="description" required maxLength={4000} />
        </label>
        <label>
          {t('zoneLabel')}
          <input type="text" name="zone" required maxLength={100} />
        </label>
        <label>
          {t('typeLabel')}
          <select name="propertyType" required defaultValue="">
            <option value="" disabled>
              —
            </option>
            {LISTING_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`type.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('areaLabel')}
          <input type="number" name="areaSqm" required min={1} step={1} />
        </label>
        <label>
          {t('priceLabel')}
          <input type="number" name="priceEgp" required min={1} step={1} />
        </label>
        <button type="submit">{t('submit')}</button>
      </form>
    </main>
  );
}
