import type { ReactNode } from 'react';
import { BottomNav } from './bottom-nav';

// Every page: a comfortably narrow centered column (this audience is on phones, not
// desktops, and a full-bleed layout on a wide viewport just reads worse) plus bottom
// padding equal to the fixed nav's height so the last bit of content is never hidden
// behind it.
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 pb-24 pt-6">
      {children}
      <BottomNav />
    </main>
  );
}
