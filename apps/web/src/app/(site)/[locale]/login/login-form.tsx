'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';

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
      <form onSubmit={handleSendCode}>
        <label>
          {t('phoneLabel')}
          <input
            type="tel"
            required
            placeholder={t('phonePlaceholder')}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <button type="submit" disabled={pending}>
          {t('sendCode')}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode}>
      <label>
        {t('codeLabel')}
        <input type="text" required inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} />
      </label>
      <button type="submit" disabled={pending}>
        {t('verifyCode')}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
