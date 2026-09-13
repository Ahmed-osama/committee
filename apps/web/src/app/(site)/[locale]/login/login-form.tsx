'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { BigButton } from '@/components/big-button';

type Step = { name: 'phone' } | { name: 'code'; requestId: string };

// Two-step OTP flow: request a code, then verify it. Deliberately one field per
// screen (see docs/projects/groundtruth.md's "keep flows shallow" audience
// constraint) rather than a single combined phone+code form.
export function LoginForm() {
  const t = useTranslations('Login');
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: 'phone' });
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        throw new Error('send failed');
      }
      const { requestId } = (await response.json()) as { requestId: string };
      setStep({ name: 'code', requestId });
    } catch {
      setError(t('sendError'));
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (step.name !== 'code') {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: step.requestId, code }),
      });
      if (!response.ok) {
        throw new Error('verify failed');
      }
      router.push('/');
      router.refresh();
    } catch {
      setError(t('verifyError'));
    } finally {
      setPending(false);
    }
  }

  if (step.name === 'phone') {
    return (
      <form onSubmit={handleSendCode} className="w-full max-w-sm">
        <p className="mb-9 text-sm text-muted">{t('subtitlePhone')}</p>
        <label className="mb-2 block text-start text-base font-bold">{t('phoneLabel')}</label>
        <input
          type="tel"
          required
          placeholder={t('phonePlaceholder')}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          dir="ltr"
          className="mb-4 h-tap w-full rounded-card border border-line px-4 text-center text-xl"
        />
        <BigButton type="submit" disabled={pending} className="w-full">
          {t('sendCode')}
        </BigButton>
        {error ? (
          <p role="alert" className="mt-3 text-base font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="w-full max-w-sm">
      <p className="mb-9 text-sm text-muted">{t('subtitleCode')}</p>
      <label className="mb-2 block text-start text-base font-bold">{t('codeLabel')}</label>
      <input
        type="text"
        required
        inputMode="numeric"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        dir="ltr"
        className="mb-4 h-tap w-full rounded-card border border-line px-4 text-center text-2xl tracking-[0.4em]"
      />
      <BigButton type="submit" disabled={pending} className="w-full">
        {t('verifyCode')}
      </BigButton>
      {error ? (
        <p role="alert" className="mt-3 text-base font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
