import { getTranslations } from 'next-intl/server';
import { PageShell } from '@/components/page-shell';
import { listPublicDealFeed } from '@/lib/deals/feed';

const TYPE_EMOJI: Record<string, string> = {
  apartment: '🏢',
  house: '🏡',
  land: '🌾',
  commercial: '🏪',
};

// Direct DB query, no DB at build time in this repo — see listings/page.tsx's
// comment. No auth check on purpose: COM-22's feed is public by design.
export const dynamic = 'force-dynamic';

export default async function DealFeedPage() {
  const t = await getTranslations('DealFeed');
  const tl = await getTranslations('Listings');
  const feed = await listPublicDealFeed();

  return (
    <PageShell>
      <h1 className="mb-1 text-xl font-bold">🤝 {t('title')}</h1>
      <p className="mb-4 text-lg text-black/60">{t('description')}</p>

      {feed.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-lg text-black/60">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {feed.map((item, index) => (
            <li key={index} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="text-3xl" aria-hidden="true">
                {TYPE_EMOJI[item.propertyType]}
              </span>
              <div className="flex-1">
                <p className="text-lg font-semibold">
                  {tl(`type.${item.propertyType}`)} — {item.zone}
                </p>
              </div>
              <p className="text-xl font-bold text-brand-dark">
                {item.agreedPriceEgp.toLocaleString()} EGP
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
