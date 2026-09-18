import { useTranslations } from 'next-intl';
import { PhoneIcon } from '@/components/icons';
import { PageShell } from '@/components/page-shell';
import { LoginForm } from './login-form';

export default function LoginPage() {
  const t = useTranslations('Login');

  return (
    <PageShell>
      <div className="mt-16 flex flex-col items-center text-center">
        <span className="mb-6 flex h-[68px] w-[68px] items-center justify-center rounded-[14px] bg-brand-light">
          <PhoneIcon width={30} height={30} className="text-brand" />
        </span>
        <h1 className="mb-2.5 text-xl font-extrabold">{t('title')}</h1>
        <LoginForm />
      </div>
    </PageShell>
  );
}
