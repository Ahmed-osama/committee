'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { AccountIcon, CheckCircleIcon, GridIcon, HomeIcon } from './icons';

// Fixed bottom tab bar — same 4 spots, same order, every screen. No hamburger menu,
// no hidden drawer: for an audience unfamiliar with typical app conventions (see
// docs/projects/groundtruth.md's audience section), navigation has to be visible
// and in the same place at all times, not something you have to know to look for.
export function BottomNav() {
  const t = useTranslations('Nav');
  const pathname = usePathname();

  const items = [
    { href: '/', icon: HomeIcon, label: t('home') },
    { href: '/listings', icon: GridIcon, label: t('listings') },
    { href: '/deals', icon: CheckCircleIcon, label: t('deals') },
    { href: '/login', icon: AccountIcon, label: t('account') },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white px-1.5 pb-3.5 pt-2">
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              className={`flex h-[26px] w-11 items-center justify-center rounded ${active ? 'bg-brand-light' : ''}`}
            >
              <Icon width={20} height={20} className={active ? 'text-brand' : 'text-faint'} />
            </span>
            <span
              className={`text-xs ${active ? 'font-bold text-brand' : 'font-medium text-faint'}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
