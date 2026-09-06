import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Excludes API routes, Next.js internals, static files with an extension, /admin
  // (COM-24's admin dashboard is deliberately unlocalized and lives outside the
  // [locale] route group), and /uploads + /photos (COM-17/18's local file-serving
  // routes — these must be reachable at a stable, unprefixed URL since they're what
  // documentUrl/selfieUrl/photo URLs stored in the DB point at).
  matcher: ['/((?!api|admin|uploads|photos|_next|_vercel|.*\\..*).*)'],
};
