import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/app/api/_lib/session';
import { getListingWithPhotos } from '@/lib/listings/listings';
import { makeOfferAction } from './offer-actions';

// See listings/page.tsx's comment — same reasoning (direct DB query, no DB at build
// time in this repo).
export const dynamic = 'force-dynamic';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('Listings');
  const tn = await getTranslations('Negotiations');
  const result = await getListingWithPhotos(id);

  if (!result || result.listing.status !== 'active') {
    notFound();
  }

  const { listing, photos } = result;
  const session = await getSession();
  const canMakeOffer = session != null && session.userId !== listing.sellerId;

  return (
    <main>
      <p>
        <Link href="/listings">{t('backToListings')}</Link>
      </p>
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      <dl>
        <dt>{t('typeLabel')}</dt>
        <dd>{t(`type.${listing.propertyType}`)}</dd>
        <dt>{t('zoneLabel')}</dt>
        <dd>{listing.zone}</dd>
        <dt>{t('areaLabel')}</dt>
        <dd>{listing.areaSqm} m²</dd>
        <dt>{t('priceLabel')}</dt>
        <dd>{listing.priceEgp.toLocaleString()} EGP</dd>
      </dl>
      {photos.length > 0 ? (
        <ul>
          {photos.map((photo) => (
            <li key={photo.id}>
              {/* Public listing photos are served from src/app/photos, not next/image's
                  optimizer — see lib/storage/local-file-storage's TODO on this being a
                  local-disk placeholder pending a real object storage vendor. */}
              <img src={photo.url} alt={listing.title} />
            </li>
          ))}
        </ul>
      ) : null}
      {canMakeOffer ? (
        <form action={makeOfferAction}>
          <input type="hidden" name="listingId" value={listing.id} />
          <label>
            {tn('offerPriceLabel')}
            <input type="number" name="offerPriceEgp" required min={1} step={1} />
          </label>
          <button type="submit">{tn('makeOffer')}</button>
        </form>
      ) : null}
    </main>
  );
}
