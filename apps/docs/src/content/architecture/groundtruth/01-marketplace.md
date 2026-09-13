---
title: 'GroundTruth marketplace'
order: 1
---

<p><code>apps/web</code> is the first product built on the committee platform
      rather than for it: a Next.js + <code>next-intl</code> (Arabic-first, RTL) real
      estate marketplace for a small Nile Delta town, backed by its own Postgres schema
      in <code>packages/db</code>. It breaks local broker collusion by letting sellers
      and buyers negotiate directly through a fixed offer/counter state machine, then
      requires <strong>both sides</strong> to independently confirm a deal before it
      counts as closed — a unilateral claim from either party is not enough.</p>
      <p>Trust and money are deliberately vendor-bought, not built: <code>packages/auth-providers</code>
      (KYC + phone OTP) and <code>packages/payment-providers</code> (credit purchases)
      are thin pluggable interfaces with mock implementations for now, swappable for a
      real vendor later without touching the app. Only closed, dual-confirmed deals ever
      feed the valuation engine (<code>apps/web/src/lib/valuation</code>), which
      publishes a fair-price band per (zone, type, area-band) cell only once enough real
      deals exist for it — no synthetic seed data, no badge until it's earned. The same
      closed deals also power a public, anonymized, no-login deal feed so the platform's
      price data is checkable before anyone signs up. Seeing a seller's actual phone
      number is a paywall behind the credit ledger, and an admin moderation dashboard
      watches for the exact gaming a broker would attempt (fake accounts, fabricated
      offers) rather than trusting the marketplace to self-police.</p>
      <div class="art">
        <svg viewBox="0 0 480 250" width="480" height="250">
          <rect width="480" height="250" fill="#ffffff"/>
          <!-- web app box -->
          <rect x="164" y="18" width="152" height="50" rx="12" fill="var(--blue-dk)" transform="translate(4,4)"/>
          <rect x="160" y="14" width="152" height="50" rx="12" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="168" y="20" width="46" height="14" rx="7" fill="#ffffff" opacity="0.3"/>
          <text x="236" y="46" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">GROUNDTRUTH WEB</text>
          <!-- seller and buyer figures shaking on a deal -->
          <g>
            <circle cx="90" cy="118" r="20" fill="var(--cream-dk)" transform="translate(3,3)"/>
            <circle cx="87" cy="115" r="20" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
            <ellipse cx="80" cy="108" rx="6" ry="3" fill="#ffffff" opacity="0.4" transform="rotate(-20 80 108)"/>
            <text x="87" y="119" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">SELL</text>
          </g>
          <g>
            <circle cx="390" cy="118" r="20" fill="var(--green-dk)" transform="translate(3,3)"/>
            <circle cx="387" cy="115" r="20" fill="var(--green)" stroke="var(--ink)" stroke-width="4"/>
            <ellipse cx="380" cy="108" rx="6" ry="3" fill="#ffffff" opacity="0.4" transform="rotate(-20 380 108)"/>
            <text x="387" y="119" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">BUY</text>
          </g>
          <path d="M107 118 Q237 150 367 118" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="2 10"/>
          <text x="237" y="150" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">DUAL-CONFIRMED DEAL</text>
          <path d="M180 65 Q140 90 107 100" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M296 65 Q336 90 367 100" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <!-- vendor plugs (KYC/OTP, payments) -->
          <rect x="24" y="176" width="110" height="42" rx="10" fill="var(--purple-dk)" transform="translate(3,3)"/>
          <rect x="20" y="172" width="110" height="42" rx="10" fill="var(--purple)" stroke="var(--ink)" stroke-width="4"/>
          <text x="75" y="197" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">KYC + OTP</text>
          <path d="M75 172 L155 90" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="1 7"/>
          <rect x="346" y="176" width="110" height="42" rx="10" fill="var(--yellow-dk)" transform="translate(3,3)"/>
          <rect x="342" y="172" width="110" height="42" rx="10" fill="var(--yellow)" stroke="var(--ink)" stroke-width="4"/>
          <text x="397" y="197" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">PAYMENTS</text>
          <path d="M397 172 L317 90" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="1 7"/>
          <!-- valuation badge earned from closed deals -->
          <g transform="translate(237,206)">
            <circle r="22" fill="var(--coral-dk)" transform="translate(3,3)"/>
            <circle r="22" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
            <ellipse cx="-7" cy="-9" rx="6" ry="3" fill="#ffffff" opacity="0.4" transform="rotate(-20)"/>
            <text y="5" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">FAIR</text>
          </g>
        </svg>
      </div>
