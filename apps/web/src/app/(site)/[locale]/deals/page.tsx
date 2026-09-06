import { getTranslations } from 'next-intl/server';
import { listPublicDealFeed } from '@/lib/deals/feed';

// Direct DB query, no DB at build time in this repo — see listings/page.tsx's
// comment. No auth check on purpose: COM-22's feed is public by design.
export const dynamic = 'force-dynamic';

export default async function DealFeedPage() {
  const t = await getTranslations('DealFeed');
  const tl = await getTranslations('Listings');
  const feed = await listPublicDealFeed();

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      {feed.length === 0 ? (
        <p>{t('empty')}</p>
      ) : (
        <ul>
          {feed.map((item, index) => (
            <li key={index}>
              {tl(`type.${item.propertyType}`)} — {item.zone} — {item.agreedPriceEgp.toLocaleString()} EGP
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
