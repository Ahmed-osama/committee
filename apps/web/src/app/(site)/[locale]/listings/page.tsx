import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CheckCircleIcon, PlusIcon } from '@/components/icons';
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
        <h1 className="text-xl font-extrabold">{t('browseTitle')}</h1>
        <Link
          href="/listings/new"
          className="flex items-center gap-1.5 rounded bg-brand px-3.5 py-2 text-sm font-bold text-white"
        >
          <PlusIcon width={15} height={15} />
          {t('newListing')}
        </Link>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Link
          href={{ pathname: '/listings', hash: 'results' }}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-4 py-2 text-sm font-bold ${
            !propertyType ? 'bg-brand text-white' : 'bg-[#F1F0EC] text-muted'
          }`}
        >
          {!propertyType ? <CheckCircleIcon width={14} height={14} /> : null}
          {t('typeLabel')}
        </Link>
        {FILTER_TYPES.map((type) => (
          <Link
            key={type}
            href={{ pathname: '/listings', query: { propertyType: type }, hash: 'results' }}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-4 py-2 text-sm font-bold ${
              propertyType === type ? 'bg-brand text-white' : 'bg-[#F1F0EC] text-muted'
            }`}
          >
            {propertyType === type ? <CheckCircleIcon width={14} height={14} /> : null}
            {t(`type.${type}`)}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p
          id="results"
          className="scroll-mt-4 rounded-card bg-white p-6 text-center text-base text-muted shadow-card"
        >
          {t('empty')}
        </p>
      ) : (
        <div id="results" className="grid scroll-mt-4 grid-cols-2 gap-3">
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
