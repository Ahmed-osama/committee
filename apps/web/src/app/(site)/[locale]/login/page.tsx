import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/page-shell';
import { LoginForm } from './login-form';

export default function LoginPage() {
  const t = useTranslations('Login');

  return (
    <PageShell>
      <div className="mt-8 flex flex-col items-center text-center">
        <span className="mb-3 text-6xl" aria-hidden="true">
          👤
        </span>
        <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
        <LoginForm />
      </div>
    </PageShell>
  );
}
