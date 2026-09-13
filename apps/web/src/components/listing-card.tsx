import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { creditForPropertyType, type PropertyTypeImageKey } from './image-credits';
import { ImageAttribution } from './image-attribution';
import { TYPE_ICON } from './icons';

export type ListingCardData = {
  id: string;
  title: string;
  zone: string;
  propertyType: PropertyTypeImageKey;
  priceEgp: number;
  photoUrl?: string;
};

// Photo first, price big and bold, everything else secondary — a low-literacy
// audience should be able to tell what a listing is and what it costs without
// reading the title. Falls back to the sourced category photo (see image-credits.ts)
// when a listing has no real uploaded photo yet, which is every simulated listing
// today (see apps/web/scripts/simulate-groundtruth.ts).
export function ListingCard({ listing }: { listing: ListingCardData }) {
  const t = useTranslations('Listings');
  const credit = creditForPropertyType(listing.propertyType);
  const photoSrc = listing.photoUrl ?? credit.src;
  const TypeIcon = TYPE_ICON[listing.propertyType];

  return (
    <Link href={`/listings/${listing.id}`} className="block overflow-hidden rounded-card bg-white shadow-card">
      <div className="relative h-28 w-full bg-brand-light">
        <Image src={photoSrc} alt="" fill sizes="(max-width: 640px) 100vw, 480px" className="object-cover" />
        {listing.photoUrl ? null : <ImageAttribution credit={credit} linked={false} />}
      </div>
      <div className="p-3">
        <p className="text-lg font-extrabold text-ink">{listing.priceEgp.toLocaleString()} EGP</p>
        <p className="text-xs font-semibold text-faint">{t('askingPriceTag')}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <TypeIcon width={13} height={13} className="text-faint" />
          <span className="text-sm font-semibold text-muted">
            {t(`type.${listing.propertyType}`)} — {listing.zone}
          </span>
        </div>
      </div>
    </Link>
  );
}
