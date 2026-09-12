import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BigLinkButton } from '@/components/big-button';
import { ListingCard } from '@/components/listing-card';
import { PageShell } from '@/components/page-shell';
import { isListingType } from '@/lib/listings/validation';
import { listActiveListings } from '@/lib/listings/listings';

// Forces runtime rendering — this queries the DB directly (no cookies()/headers()
// call for Next to auto-detect as dynamic), and `next build` has no DB credentials
// in this repo (no live Neon provisioning — see apps/web/README.md), so without this
// a build would try to prerender against a database that isn't there.
export const dynamic = 'force-dynamic';

const FILTER_TYPES = ['apartment', 'house', 'land', 'commercial'] as const;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyType?: string }>;
}) {
  const { propertyType: rawType } = await searchParams;
  const propertyType = isListingType(rawType) ? rawType : undefined;

  const t = await getTranslations('Listings');
  const listings = await listActiveListings(propertyType ? { propertyType } : undefined);

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('browseTitle')}</h1>
        <BigLinkButton href="/listings/new" variant="primary" className="h-11 px-4 text-base">
          + {t('newListing')}
        </BigLinkButton>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/listings"
          className={`rounded-full border-2 px-4 py-2 text-base font-medium ${
            !propertyType
              ? 'border-brand bg-brand text-white'
              : 'border-black/15 bg-white text-black/70'
          }`}
        >
          {t('typeLabel')}: {propertyType ? '' : '✓'}
        </Link>
        {FILTER_TYPES.map((type) => (
          <Link
            key={type}
            href={{ pathname: '/listings', query: { propertyType: type } }}
            className={`rounded-full border-2 px-4 py-2 text-base font-medium ${
              propertyType === type
                ? 'border-brand bg-brand text-white'
                : 'border-black/15 bg-white text-black/70'
            }`}
          >
            {t(`type.${type}`)}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-lg text-black/60">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={{
                id: listing.id,
                title: listing.title,
                zone: listing.zone,
                propertyType: listing.propertyType,
                priceEgp: listing.priceEgp,
              }}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
