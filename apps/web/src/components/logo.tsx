// GroundTruth's mark: an angular plot outline with a checkmark — a verified plot of
// land/property, tying directly into the product's real-data/anti-collusion story
// (see docs/projects/groundtruth.md). Deliberately angular, not a soft blob, to match
// the app's reduced-roundness visual language.
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-brand"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 32 32" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13 L16 5 L26 13 L23 25 L9 25 Z" />
        <path d="M11.5 17.5 L15 21 L21.5 13.5" />
      </svg>
    </div>
  );
}
