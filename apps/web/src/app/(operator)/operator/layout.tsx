import type { ReactNode } from 'react';

// A second, sibling root layout, same pattern as (admin)/admin/layout.tsx — its own
// <html>/<body>, never wrapped in next-intl's provider or given a locale prefix.
// COM-35's operator tooling is internal staff tooling, not end-user-facing, so it
// stays English-only/unlocalized on purpose, same reasoning as COM-24's dashboard.
// src/proxy.ts's matcher excludes /operator so next-intl's middleware never touches it.
export default function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
