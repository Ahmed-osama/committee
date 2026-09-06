import { useTranslations } from 'next-intl';
import { LoginForm } from './login-form';

export default function LoginPage() {
  const t = useTranslations('Login');

  return (
    <main>
      <h1>{t('title')}</h1>
      <LoginForm />
    </main>
  );
}
