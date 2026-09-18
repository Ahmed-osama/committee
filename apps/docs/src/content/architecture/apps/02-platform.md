---
title: 'Platform: apps on shared core'
order: 2
---

<p><code>apps/_template</code> is a baseline scaffold (package.json/tsconfig
      wiring already globbed into the workspace) to copy when bootstrapping a new
      app, instead of re-deriving that plumbing each time. <code>apps/digest</code>
      is the first app built from it — a second real consumer of
      <code>@committee/core</code>, deliberately kept separate from committee's own
      relational schema. It keeps its own flat JSON append-log
      (<code>apps/digest/src/history.ts</code>) instead.</p>
      <p><code>packages/core/DIVERGENCE.md</code> records why: committee's session
      memory and provider routing are shaped by a multi-turn debate with real state
      transitions, while digest's is "one topic in, one call, one output" — genuinely
      different needs, not a gap to paper over. Only the pieces both apps
      independently re-derived by hand — <code>generateForAgent</code> and
      <code>SHARED_MODEL_BY_PROVIDER</code> — got pulled into core's exports; a
      shared <code>SessionStore</code> or <code>LLMClient</code> stays premature
      until a third app's needs land somewhere between these two.</p>
      <div class="art">
        <svg viewBox="0 0 480 250" width="480" height="250">
          <rect width="480" height="250" fill="#ffffff"/>
          <!-- core circle -->
          <circle cx="243" cy="46" r="30" fill="var(--yellow-dk)"/>
          <circle cx="240" cy="42" r="30" fill="var(--yellow)" stroke="var(--ink)" stroke-width="5"/>
          <ellipse cx="229" cy="30" rx="10" ry="5" fill="#ffffff" opacity="0.4"/>
          <text x="240" y="47" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">CORE</text>
          <path d="M228 68 Q160 96 120 118" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M120 118 L128 104 M120 118 L136 112" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M252 68 Q320 96 360 118" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M360 118 L344 112 M360 118 L352 104" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- committee app box -->
          <rect x="34" y="122" width="150" height="50" rx="12" fill="var(--blue-dk)" transform="translate(4,4)"/>
          <rect x="30" y="118" width="150" height="50" rx="12" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="38" y="124" width="46" height="14" rx="7" fill="#ffffff" opacity="0.3"/>
          <text x="105" y="150" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">COMMITTEE</text>
          <!-- digest app box -->
          <rect x="300" y="122" width="150" height="50" rx="12" fill="var(--green-dk)" transform="translate(4,4)"/>
          <rect x="296" y="118" width="150" height="50" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="304" y="124" width="46" height="14" rx="7" fill="#ffffff" opacity="0.3"/>
          <text x="371" y="150" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">DIGEST</text>
          <!-- relational db cylinder under committee -->
          <g transform="translate(80,196)">
            <path d="M4 8 V32 A25 8 0 0 0 54 32 V8" fill="var(--cream-dk)"/>
            <ellipse cx="29" cy="8" rx="25" ry="8" fill="var(--cream-dk)"/>
            <path d="M0 6 V30 A25 8 0 0 0 50 30 V6" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
            <ellipse cx="25" cy="6" rx="25" ry="8" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          </g>
          <text x="105" y="248" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">RELATIONAL DB</text>
          <!-- flat json log under digest -->
          <rect x="349" y="200" width="46" height="36" rx="5" fill="var(--cream-dk)" transform="translate(3,3)"/>
          <rect x="346" y="197" width="46" height="36" rx="5" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <line x1="353" y1="207" x2="385" y2="207" stroke="var(--ink)" stroke-width="2.5"/>
          <line x1="353" y1="215" x2="385" y2="215" stroke="var(--ink)" stroke-width="2.5"/>
          <line x1="353" y1="223" x2="378" y2="223" stroke="var(--ink)" stroke-width="2.5"/>
          <text x="371" y="248" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">FLAT JSON LOG</text>
          <!-- template stamp feeding digest -->
          <g transform="translate(430,60)">
            <rect x="-26" y="-22" width="52" height="42" rx="8" fill="var(--purple-dk)" transform="translate(3,3)"/>
            <rect x="-28" y="-24" width="52" height="42" rx="8" fill="var(--purple)" stroke="var(--ink)" stroke-width="4"/>
            <path d="M-28 -24 L-8 -4 L-8 -24 Z" fill="#ffffff" opacity="0.35"/>
          </g>
          <text x="430" y="94" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">_TEMPLATE</text>
          <path d="M420 70 Q400 90 378 110" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M378 110 L382 96 M378 110 L392 106" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
