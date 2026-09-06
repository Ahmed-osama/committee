import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware wrappers around next/navigation's Link/redirect/usePathname/useRouter —
// route to these instead of next/navigation directly so locale prefixes stay correct.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
