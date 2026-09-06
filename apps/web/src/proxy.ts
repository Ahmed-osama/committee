import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Excludes API routes, Next.js internals, static files with an extension, and
  // /admin — COM-24's admin dashboard is deliberately unlocalized and lives outside
  // the [locale] route group, so it must never get a locale prefix injected.
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
};
