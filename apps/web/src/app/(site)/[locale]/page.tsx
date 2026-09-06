import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <p>
        <Link href="/listings">{t('browseListings')}</Link>
      </p>
    </main>
  );
}
