import type { ImageCredit } from './image-credits';

// Small, unobtrusive photo credit — legally required for the CC-BY sourced photos
// (see image-credits.ts), kept tiny/muted since it's not content the audience needs
// to read, just a compliance detail. `linked: false` renders a plain <span> instead
// of an <a> — required wherever this sits inside another link (e.g. ListingCard),
// since a nested <a> is invalid HTML and React warns/breaks hydration.
export function ImageAttribution({ credit, linked = true }: { credit: ImageCredit; linked?: boolean }) {
  const className = 'absolute bottom-1 end-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] leading-none text-white/80';
  const label = (
    <>
      {credit.author} · {credit.license}
    </>
  );

  if (!linked) {
    return <span className={className}>{label}</span>;
  }

  return (
    <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  );
}
