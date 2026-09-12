import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BigLinkButton } from '@/components/big-button';
import { CheckCircleIcon, HouseIcon } from '@/components/icons';
import { IMAGE_CREDITS } from '@/components/image-credits';
import { ImageAttribution } from '@/components/image-attribution';
import { Logo } from '@/components/logo';
import { PageShell } from '@/components/page-shell';

const CATEGORIES = [
  { type: 'apartment' as const },
  { type: 'house' as const },
  { type: 'land' as const },
  { type: 'commercial' as const },
];

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tl = useTranslations('Listings');

  return (
    <PageShell>
      <div className="mb-3.5 flex items-center gap-2">
        <Logo size={32} />
        <span className="text-base font-bold text-muted">GroundTruth</span>
      </div>
      <h1 className="mb-5 text-2xl font-extrabold leading-snug tracking-tight">{t('title')}</h1>

      <div className="relative -mx-4 mb-5 h-36 overflow-hidden rounded-media">
        <Image src={IMAGE_CREDITS.hero.src} alt="" fill sizes="100vw" className="object-cover" priority />
        <ImageAttribution credit={IMAGE_CREDITS.hero} />
      </div>

      <div className="mb-7 flex flex-col gap-2.5">
        <BigLinkButton href="/listings" variant="primary" className="h-auto justify-start px-4 py-4">
          <HouseIcon width={24} height={24} />
          <span className="flex-1 text-start text-lg">{t('browseListings')}</span>
        </BigLinkButton>
        <BigLinkButton href="/deals" variant="secondary" className="h-auto justify-start px-4 py-4">
          <span className="flex h-8.5 w-8.5 items-center justify-center rounded-card bg-brand-light">
            <CheckCircleIcon width={18} height={18} className="text-brand" />
          </span>
          <span className="flex-1 text-start text-lg">{t('viewDealFeed')}</span>
        </BigLinkButton>
      </div>

      <h2 className="mb-3 text-sm font-bold text-muted">{t('browseByType')}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((category) => (
          <Link
            key={category.type}
            href={{ pathname: '/listings', query: { propertyType: category.type } }}
            className="relative block h-[104px] overflow-hidden rounded-card"
          >
            <Image
              src={`/images/${category.type}.jpg`}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 240px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <span className="absolute bottom-2.5 end-3 text-base font-bold text-white">
              {tl(`type.${category.type}`)}
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
