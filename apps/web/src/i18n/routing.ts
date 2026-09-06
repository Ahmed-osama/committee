import { defineRouting } from 'next-intl/routing';

// Arabic-first per the audience constraint in docs/projects/groundtruth.md — 'ar' is
// the default locale, not 'en'. 'en' exists for internal/dev use, not end users.
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

// Locales that render right-to-left. COM-16 only wires up 'ar'; the RTL_LOCALES set
// (not a hardcoded per-locale if/else) is what LocaleLayout keys `dir` off, so adding
// another RTL locale later is a one-line change.
export const RTL_LOCALES = new Set<(typeof routing.locales)[number]>(['ar']);
