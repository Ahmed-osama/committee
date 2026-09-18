import type { SVGProps } from 'react';

// Inline stroke-based SVG icon set — replaces the earlier emoji-as-icons approach.
// One consistent style: 24px viewBox, round caps/joins, currentColor stroke so each
// call site controls color via className/style rather than baking colors into markup.
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

export function AccountIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.8-4 5-6 8-6s6.2 2 8 6" />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// Points start-ward in an RTL layout (mirror with `rtl:rotate-180` at the call site
// for a shared LTR/RTL icon file, or just rotate via className as needed).
export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.6} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ApartmentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export function HouseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function LandIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h16M6 20V10l6-6 6 6v10" />
    </svg>
  );
}

export function CommercialIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function RulerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 16l5-5 3 3 5-5 5 5" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function TagOfferIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12l4-2 4 3 4-6 6 5" />
      <path d="M3 12v7h18v-7" />
    </svg>
  );
}

export function PhoneCallIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5c0 8.3 6.7 15 15 15l3-4-6-2-2 2c-2.8-1.2-5-3.4-6.2-6.2l2-2-2-6-4 3z" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 18h4" />
    </svg>
  );
}

export const TYPE_ICON = {
  apartment: ApartmentIcon,
  house: HouseIcon,
  land: LandIcon,
  commercial: CommercialIcon,
} as const;
