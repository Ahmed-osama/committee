import type { ReactNode } from 'react';

// A second, sibling root layout to (site)/[locale]/layout.tsx — its own <html>/
// <body>, deliberately never wrapped in next-intl's provider or given a locale
// prefix. COM-24's dashboard is internal tooling, not end-user-facing, so it stays
// English-only/unlocalized on purpose (see docs/projects/groundtruth.md: COM-25's
// Arabic pass explicitly excludes it). src/proxy.ts's matcher excludes /admin so
// next-intl's locale-detection middleware never touches this route.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
