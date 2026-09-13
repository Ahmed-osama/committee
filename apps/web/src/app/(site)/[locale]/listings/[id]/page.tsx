import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/app/api/_lib/session';
import { BigButton } from '@/components/big-button';
import { creditForPropertyType } from '@/components/image-credits';
import { ImageAttribution } from '@/components/image-attribution';
import { BackIcon, CheckCircleIcon, PhoneCallIcon, PinIcon, RulerIcon, TagOfferIcon, TYPE_ICON } from '@/components/icons';
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
  const reveal = session != null && !isOwner ? await getExistingReveal(session.userId, listing.id) : null;
  // Suppressed (null) entirely, not a "not enough data yet" placeholder, until
  // MIN_DEALS_FOR_VALUATION real dual-confirmed deals exist for this cell — see
  // lib/valuation/valuation.ts.
  const valuation = await getValuationForListing(listing.zone, listing.propertyType, listing.areaSqm);
  const credit = creditForPropertyType(listing.propertyType);
  const heroPhoto = photos[0]?.url ?? credit.src;
  const TypeIcon = TYPE_ICON[listing.propertyType];

  return (
    <PageShell>
      <Link href="/listings" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
        <BackIcon width={17} height={17} className="rtl:rotate-180" />
        {t('backToListings')}
      </Link>

      <div className="relative mb-4 h-52 w-full overflow-hidden rounded-media bg-brand-light">
        <Image src={heroPhoto} alt="" fill sizes="100vw" className="object-cover" />
        {photos.length === 0 ? <ImageAttribution credit={credit} /> : null}
      </div>

      <p className="text-3xl font-extrabold tracking-tight text-ink">
        {listing.priceEgp.toLocaleString()} <span className="text-base font-bold text-muted">EGP</span>
      </p>
      <p className="text-sm font-semibold text-faint">{t('askingPriceTag')}</p>
      <h1 className="mt-1 text-base font-semibold text-muted">{listing.title}</h1>

      {valuation ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-card bg-brand-light p-3.5">
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded bg-brand">
            <CheckCircleIcon width={15} height={15} className="text-white" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-brand-dark">{tv('label')}</p>
            <p className="mt-0.5 text-xs text-brand-dark/80">
              {valuation.avgPricePerSqmEgp.toLocaleString()} {tv('perSqm')} — {tv('basedOn', { count: valuation.dealCount })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-3 divide-x divide-line divide-x-reverse rounded-card bg-white shadow-card">
        <div className="flex flex-col items-center gap-1 py-3.5">
          <TypeIcon width={19} height={19} className="text-brand" />
          <span className="text-base font-extrabold">{t(`type.${listing.propertyType}`)}</span>
          <span className="text-xs text-faint">{t('typeLabel')}</span>
        </div>
        <div className="flex flex-col items-center gap-1 py-3.5">
          <PinIcon width={19} height={19} className="text-brand" />
          <span className="text-base font-extrabold">{listing.zone}</span>
          <span className="text-xs text-faint">{t('zoneLabel')}</span>
        </div>
        <div className="flex flex-col items-center gap-1 py-3.5">
          <RulerIcon width={19} height={19} className="text-brand" />
          <span className="text-base font-extrabold">{listing.areaSqm} m²</span>
          <span className="text-xs text-faint">{t('areaLabel')}</span>
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-[#4A4A46]">{listing.description}</p>

      {photos.length > 1 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {photos.slice(1).map((photo) => (
            <div key={photo.id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-card bg-brand-light">
              {/* Public listing photos are served from src/app/photos, not next/image's
                  optimizer — see lib/storage/local-file-storage's TODO on this being a
                  local-disk placeholder pending a real object storage vendor. */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      {canMakeOffer ? (
        <form action={makeOfferAction} className="mt-5 rounded-card bg-white p-4 shadow-card">
          <input type="hidden" name="listingId" value={listing.id} />
          <label className="mb-2 block text-base font-bold">{tn('offerPriceLabel')}</label>
          <input
            type="number"
            name="offerPriceEgp"
            required
            min={1}
            step={1}
            className="mb-3 h-tap w-full rounded-card border border-line px-4 text-xl"
          />
          <BigButton type="submit" className="w-full">
            <TagOfferIcon width={20} height={20} />
            {tn('makeOffer')}
          </BigButton>
        </form>
      ) : null}

      {session != null && !isOwner ? (
        reveal ? (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-card bg-brand-light p-4 text-xl font-bold text-brand-dark" dir="ltr">
            <PhoneCallIcon width={20} height={20} />
            {reveal.phone}
          </p>
        ) : (
          <form action={revealContactAction} className="mt-4">
            <BigButton type="submit" variant="secondary" className="w-full">
              <PhoneCallIcon width={19} height={19} />
              {tc('revealContact')}
            </BigButton>
          </form>
        )
      ) : null}
    </PageShell>
  );
}
