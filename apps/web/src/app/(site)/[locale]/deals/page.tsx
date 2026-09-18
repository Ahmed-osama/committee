import { getTranslations } from 'next-intl/server';
import { CheckCircleIcon, TYPE_ICON } from '@/components/icons';
import { PageShell } from '@/components/page-shell';
import { listPublicDealFeed } from '@/lib/deals/feed';

// Direct DB query, no DB at build time in this repo — see listings/page.tsx's
// comment. No auth check on purpose: COM-22's feed is public by design.
export const dynamic = 'force-dynamic';

export default async function DealFeedPage() {
  const t = await getTranslations('DealFeed');
  const tl = await getTranslations('Listings');
  const feed = await listPublicDealFeed();

  return (
    <PageShell>
      <h1 className="mb-2 text-xl font-extrabold">{t('title')}</h1>
      <p className="mb-4 text-sm leading-relaxed text-muted">{t('description')}</p>

      {feed.length === 0 ? (
        <p className="rounded-card bg-white p-6 text-center text-base text-muted shadow-card">
          {t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {feed.map((item, index) => {
            const TypeIcon = TYPE_ICON[item.propertyType];
            return (
              <li
                key={index}
                className="flex items-center gap-3 rounded-card bg-white p-3.5 shadow-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#F1F0EC]">
                  <TypeIcon width={18} height={18} className="text-ink" />
                </span>
                <span className="flex-1 text-base font-bold">
                  {tl(`type.${item.propertyType}`)} — {item.zone}
                </span>
                <span className="flex flex-col items-end gap-0.5">
                  <span className="text-lg font-extrabold">
                    {item.agreedPriceEgp.toLocaleString()} EGP
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-brand">
                    <CheckCircleIcon width={12} height={12} />
                    {t('soldTag')}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
