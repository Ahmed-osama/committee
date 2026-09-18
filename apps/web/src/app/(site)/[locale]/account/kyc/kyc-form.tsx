'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { BigButton } from '@/components/big-button';

// Three files (ID front, ID back, selfie) plus the national ID number, submitted as
// multipart/form-data straight to the existing /api/kyc/submit route — that route
// and its 'private' storage bucket already work (see local-file-storage.ts); the
// only thing that was missing was a UI that could actually reach it.
export function KycForm() {
  const t = useTranslations('Kyc');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const document = formData.get('documentFront');
    if (!(document instanceof File) || document.size === 0) {
      setError(t('documentRequired'));
      return;
    }
    const selfie = formData.get('selfie');
    if (!(selfie instanceof File) || selfie.size === 0) {
      setError(t('selfieRequired'));
      return;
    }

    // /api/kyc/submit only accepts one `document` field today (ID front) — ID back
    // capture is collected in this form for the vendor validation follow-up
    // (COM-53) but isn't sent yet since the backend contract doesn't take it.
    const submission = new FormData();
    submission.set('document', document);
    submission.set('selfie', selfie);
    submission.set('nationalIdNumber', String(formData.get('nationalIdNumber') ?? ''));

    setPending(true);
    try {
      const response = await fetch('/api/kyc/submit', { method: 'POST', body: submission });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? t('submitError'));
      }
      router.push('/account/kyc');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitError'));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <label className="mb-2 block text-start text-base font-bold">{t('nationalIdLabel')}</label>
      <input
        type="text"
        name="nationalIdNumber"
        required
        inputMode="numeric"
        maxLength={14}
        dir="ltr"
        className="mb-4 h-tap w-full rounded-card border border-line px-4 text-center text-lg"
      />

      <label className="mb-2 block text-start text-base font-bold">{t('documentFrontLabel')}</label>
      <input
        type="file"
        name="documentFront"
        accept="image/*"
        capture="environment"
        required
        className="mb-4 w-full text-base"
      />

      <label className="mb-2 block text-start text-base font-bold">{t('documentBackLabel')}</label>
      <input
        type="file"
        name="documentBack"
        accept="image/*"
        capture="environment"
        className="mb-4 w-full text-base"
      />

      <label className="mb-2 block text-start text-base font-bold">{t('selfieLabel')}</label>
      <input
        type="file"
        name="selfie"
        accept="image/*"
        capture="user"
        required
        className="mb-4 w-full text-base"
      />

      <BigButton type="submit" disabled={pending} className="w-full">
        {t('submit')}
      </BigButton>
      {error ? (
        <p role="alert" className="mt-3 text-base font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
