---
title: 'Icon-first, image-led UI'
order: 2
---

<p>Every screen is built from a small shared component set —
      <code>PageShell</code>, <code>BigLinkButton</code>/<code>BigButton</code>,
      <code>BottomNav</code>, <code>ListingCard</code>, and a hand-drawn
      <code>icons.tsx</code> set — instead of ad-hoc markup per page, so the same
      visual rule applies everywhere rather than being re-decided screen by screen.
      That rule follows directly from the audience: older, less tech-native,
      lower-literacy users (<code>docs/projects/groundtruth.md</code>) shouldn't need
      to read to use the app. A listing card leads with its photo and a big bold
      price, an icon before the property type text; every button is the same large
      56px tap target regardless of importance; navigation is a fixed 4-icon bottom
      bar in the same order on every screen, never a hamburger menu or a drawer
      someone has to already know exists.</p>
      <p>Photos are real category photos (<code>image-credits.ts</code>) used as a
      fallback until a listing has its own uploaded photo, since a blank/gray box
      reads as broken rather than "no photo yet" to this audience.
      <code>apps/web/scripts/simulate-groundtruth.ts</code> exercises the real
      routes end-to-end (signup through a closed deal) so this whole flow gets
      checked by a script instead of only by hand-clicking through screens.</p>
      <div class="art">
        <svg viewBox="0 0 420 260" width="420" height="260">
          <rect width="420" height="260" fill="#ffffff"/>
          <rect x="128" y="10" width="164" height="220" rx="20" fill="var(--blue-dk)" transform="translate(4,4)"/>
          <rect x="124" y="6" width="164" height="220" rx="20" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="140" y="24" width="132" height="72" rx="10" fill="var(--cream-dk)" transform="translate(3,3)"/>
          <rect x="137" y="21" width="132" height="72" rx="10" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <ellipse cx="150" cy="34" rx="10" ry="5" fill="#ffffff" opacity="0.4" transform="rotate(-20 150 34)"/>
          <path d="M155 78 l16 -22 l14 14 l10 -12 l14 20 z" fill="var(--green)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
          <rect x="140" y="102" width="90" height="16" rx="6" fill="var(--coral)" stroke="var(--ink)" stroke-width="3"/>
          <text x="185" y="114" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">450,000</text>
          <rect x="140" y="128" width="70" height="10" rx="5" fill="var(--ink)" opacity="0.15"/>
          <rect x="140" y="152" width="132" height="34" rx="10" fill="var(--green-dk)" transform="translate(3,3)"/>
          <rect x="137" y="149" width="132" height="34" rx="10" fill="var(--green)" stroke="var(--ink)" stroke-width="4"/>
          <text x="203" y="171" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">VIEW</text>
          <rect x="124" y="196" width="164" height="30" rx="0" fill="#ffffff" stroke="var(--ink)" stroke-width="4"/>
          <circle cx="155" cy="211" r="9" fill="var(--purple)" stroke="var(--ink)" stroke-width="3"/>
          <circle cx="187" cy="211" r="9" fill="var(--yellow)" stroke="var(--ink)" stroke-width="3"/>
          <circle cx="219" cy="211" r="9" fill="var(--coral)" stroke="var(--ink)" stroke-width="3"/>
          <circle cx="251" cy="211" r="9" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
          <text x="206" y="250" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">PHOTO + ICON, ALWAYS BEFORE TEXT</text>
          <path d="M40 60 Q80 50 122 45" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="2 8"/>
          <text x="40" y="45" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">CARD</text>
          <path d="M40 211 Q75 211 122 211" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="2 8"/>
          <text x="40" y="196" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">FIXED NAV</text>
        </svg>
      </div>
