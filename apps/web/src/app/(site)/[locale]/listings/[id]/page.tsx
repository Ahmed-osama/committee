import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/app/api/_lib/session';
import { BigButton } from '@/components/big-button';
import { creditForPropertyType } from '@/components/image-credits';
import { ImageAttribution } from '@/components/image-attribution';
import { PageShell } from '@/components/page-shell';
import { getListingWithPhotos } from '@/lib/listings/listings';
import { getExistingReveal } from '@/lib/payments/credits';
import { getValuationForListing } from '@/lib/valuation/engine';
import { makeOfferAction } from './offer-actions';
import { revealContactAction } from './reveal-actions';

// See listings/page.tsx's comment — same reasoning (direct DB query, no DB at build
// time in this repo).
export const dynamic = 'force-dynamic';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('Listings');
  const tn = await getTranslations('Negotiations');
  const tc = await getTranslations('Credits');
  const tv = await getTranslations('Valuation');
  const result = await getListingWithPhotos(id);

  if (!result || result.listing.status !== 'active') {
    notFound();
  }

  const { listing, photos } = result;
  const session = await getSession();
  const isOwner = session != null && session.userId === listing.sellerId;
  const canMakeOffer = session != null && !isOwner;
  const reveal =
    session != null && !isOwner ? await getExistingReveal(session.userId, listing.id) : null;
  // Suppressed (null) entirely, not a "not enough data yet" placeholder, until
  // MIN_DEALS_FOR_VALUATION real dual-confirmed deals exist for this cell — see
  // lib/valuation/valuation.ts.
  const valuation = await getValuationForListing(
    listing.zone,
    listing.propertyType,
    listing.areaSqm,
  );
  const credit = creditForPropertyType(listing.propertyType);
  const heroPhoto = photos[0]?.url ?? credit.src;

  return (
    <PageShell>
      <Link
        href="/listings"
        className="mb-3 inline-flex items-center gap-1 text-lg font-medium text-brand-dark"
      >
        ← {t('backToListings')}
      </Link>

      <div className="relative -mx-4 mb-4 h-56 w-full bg-brand-light">
        <Image src={heroPhoto} alt="" fill sizes="100vw" className="object-cover" />
        {photos.length === 0 ? <ImageAttribution credit={credit} /> : null}
      </div>

      <p className="text-3xl font-extrabold text-brand-dark">
        {listing.priceEgp.toLocaleString()} EGP
      </p>
      <h1 className="mt-1 text-xl font-bold">{listing.title}</h1>

      {valuation ? (
        <p className="mt-2 inline-block rounded-full bg-brand-light px-3 py-1.5 text-base font-medium text-brand-dark">
          📊 {tv('label')}: {valuation.avgPricePerSqmEgp.toLocaleString()} {tv('perSqm')} (
          {tv('basedOn', { count: valuation.dealCount })})
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <p className="text-base text-black/50">{t('typeLabel')}</p>
          <p className="text-lg font-semibold">{t(`type.${listing.propertyType}`)}</p>
        </div>
        <div>
          <p className="text-base text-black/50">{t('zoneLabel')}</p>
          <p className="text-lg font-semibold">{listing.zone}</p>
        </div>
        <div>
          <p className="text-base text-black/50">{t('areaLabel')}</p>
          <p className="text-lg font-semibold">{listing.areaSqm} m²</p>
        </div>
      </div>

      <p className="mt-4 text-lg leading-relaxed">{listing.description}</p>

      {photos.length > 1 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {photos.slice(1).map((photo) => (
            <div
              key={photo.id}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-light"
            >
              {/* Public listing photos are served from src/app/photos, not next/image's
                  optimizer — see lib/storage/local-file-storage's TODO on this being a
                  local-disk placeholder pending a real object storage vendor. */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      {canMakeOffer ? (
        <form action={makeOfferAction} className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <input type="hidden" name="listingId" value={listing.id} />
          <label className="mb-2 block text-lg font-semibold">{tn('offerPriceLabel')}</label>
          <input
            type="number"
            name="offerPriceEgp"
            required
            min={1}
            step={1}
            className="mb-3 h-tap w-full rounded-xl border-2 border-black/15 px-4 text-xl"
          />
          <BigButton type="submit" className="w-full">
            🤝 {tn('makeOffer')}
          </BigButton>
        </form>
      ) : null}

      {session != null && !isOwner ? (
        reveal ? (
          <p
            className="mt-4 rounded-2xl bg-brand-light p-4 text-xl font-bold text-brand-dark"
            dir="ltr"
          >
            📞 {reveal.phone}
          </p>
        ) : (
          <form action={revealContactAction} className="mt-4">
            <BigButton type="submit" variant="secondary" className="w-full">
              📞 {tc('revealContact')}
            </BigButton>
          </form>
        )
      ) : null}
    </PageShell>
  );
}
