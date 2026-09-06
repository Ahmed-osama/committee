import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listActiveListings } from '@/lib/listings/listings';

// Forces runtime rendering — this queries the DB directly (no cookies()/headers()
// call for Next to auto-detect as dynamic), and `next build` has no DB credentials
// in this repo (no live Neon provisioning — see apps/web/README.md), so without this
// a build would try to prerender against a database that isn't there.
export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  const t = await getTranslations('Listings');
  const listings = await listActiveListings();

  return (
    <main>
      <h1>{t('browseTitle')}</h1>
      <p>
        <Link href="/listings/new">{t('newListing')}</Link>
      </p>
      {listings.length === 0 ? (
        <p>{t('empty')}</p>
      ) : (
        <ul>
          {listings.map((listing) => (
            <li key={listing.id}>
              <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
              {' — '}
              {t(`type.${listing.propertyType}`)}
              {' — '}
              {listing.zone}
              {' — '}
              {listing.priceEgp.toLocaleString()} EGP
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
