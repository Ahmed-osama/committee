---
title: 'Persistence'
order: 1
---

<p>Everything lives in one SQLite database via Drizzle
      (<code>persistence/schema.ts</code>): <code>agents</code>,
      <code>conversations</code>, <code>messages</code>, and
      <code>provider_calls</code> — a single event log that doubles as both
      the rate-limit window (count rows in the last minute/day) and spend
      tracking (sum <code>cost_usd</code>), since both are just different
      queries over "what LLM calls actually happened."</p>
      <div class="art">
        <svg viewBox="0 0 400 230" width="400" height="230">
          <rect width="400" height="230" fill="#ffffff"/>
          <g transform="translate(85,32)">
            <path d="M4 18 V134 A60 18 0 0 0 124 134 V18" fill="var(--blue-dk)"/>
            <ellipse cx="60" cy="14" rx="60" ry="18" fill="var(--blue-dk)"/>
            <path d="M0 14 V130 A60 18 0 0 0 120 130 V14" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
            <ellipse cx="60" cy="14" rx="60" ry="18" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
            <ellipse cx="60" cy="130" rx="60" ry="18" fill="none" stroke="var(--ink)" stroke-width="5"/>
            <ellipse cx="60" cy="70" rx="60" ry="18" fill="none" stroke="var(--ink)" stroke-width="2.5" opacity="0.45"/>
            <ellipse cx="30" cy="6" rx="18" ry="5" fill="#ffffff" opacity="0.4"/>
          </g>
          <g font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">
            <rect x="248" y="36" width="122" height="28" rx="9" fill="var(--cream-dk)" transform="translate(3,3)"/>
            <rect x="248" y="36" width="122" height="28" rx="9" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
            <text x="309" y="55" text-anchor="middle">AGENTS</text>
            <rect x="248" y="72" width="132" height="28" rx="9" fill="var(--cream-dk)" transform="translate(3,3)"/>
            <rect x="248" y="72" width="132" height="28" rx="9" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
            <text x="314" y="91" text-anchor="middle">CONVERSATIONS</text>
            <rect x="248" y="108" width="122" height="28" rx="9" fill="var(--cream-dk)" transform="translate(3,3)"/>
            <rect x="248" y="108" width="122" height="28" rx="9" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
            <text x="309" y="127" text-anchor="middle">MESSAGES</text>
            <rect x="248" y="144" width="132" height="28" rx="9" fill="var(--cream-dk)" transform="translate(3,3)"/>
            <rect x="248" y="144" width="132" height="28" rx="9" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
            <text x="314" y="163" text-anchor="middle">PROVIDER_CALLS</text>
          </g>
        </svg>
      </div>
