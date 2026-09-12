import type { ImageCredit } from './image-credits';

// Small, unobtrusive photo credit — legally required for the CC-BY sourced photos
// (see image-credits.ts), kept tiny/muted since it's not content the audience needs
// to read, just a compliance detail.
export function ImageAttribution({ credit }: { credit: ImageCredit }) {
  return (
    <a
      href={credit.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-1 end-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] leading-none text-white/80"
    >
      {credit.author} · {credit.license}
    </a>
  );
}
