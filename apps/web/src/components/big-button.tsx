import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

// 56px-tall, full-width-by-default, high-contrast tap target — see tailwind.config.js's
// `tap` spacing token and docs/projects/groundtruth.md's audience section. `variant`
// only changes color weight, never size: every button on this app is this big.
const BASE = 'flex h-tap min-w-tap items-center justify-center gap-2 rounded-card px-5 text-lg font-bold';
const VARIANTS = {
  primary: 'bg-brand text-white',
  secondary: 'bg-white text-ink border border-line',
} as const;

type Variant = keyof typeof VARIANTS;

export function BigButton({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={`${BASE} ${VARIANTS[variant]} ${className}`} />;
}

export function BigLinkButton({
  href,
  variant = 'primary',
  children,
  className = '',
}: {
  href: Parameters<typeof Link>[0]['href'];
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}
