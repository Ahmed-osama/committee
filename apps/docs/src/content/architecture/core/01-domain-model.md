---
title: 'Domain model'
order: 1
---

<p><code>packages/core/src/domain</code> defines the three core shapes.
      An <strong>Agent</strong> is a role + provider preference, not a running
      process. A <strong>Conversation</strong> is one goal being worked on.
      A <strong>Message</strong> is one turn — it carries a real
      <code>intent</code> (propose / challenge / clarify / agree / finalize /
      human / error) because planning is argumentative, not just structured
      status updates.</p>
      <div class="art">
        <svg viewBox="0 0 480 210" width="480" height="210">
          <rect width="480" height="210" fill="#ffffff"/>
          <!-- Agent card -->
          <rect x="16" y="56" width="120" height="100" rx="16" fill="var(--blue-dk)"/>
          <rect x="10" y="50" width="120" height="100" rx="16" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="18" y="58" width="44" height="18" rx="9" fill="#ffffff" opacity="0.28" transform="rotate(-18 40 67)"/>
          <circle cx="70" cy="90" r="14" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <path d="M50 122 q20 -18 40 0" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <text x="70" y="142" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">AGENT</text>
          <path d="M132 100 H172" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
          <path d="M172 100 L158 92 M172 100 L158 108" stroke="var(--ink)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Conversation card -->
          <rect x="178" y="56" width="124" height="100" rx="16" fill="var(--purple-dk)"/>
          <rect x="172" y="50" width="124" height="100" rx="16" fill="var(--purple)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="180" y="58" width="44" height="18" rx="9" fill="#ffffff" opacity="0.28" transform="rotate(-18 202 67)"/>
          <path d="M206 88 h56 v26 h-16 l-10 12 v-12 h-30 z" fill="#ffffff" stroke="var(--ink)" stroke-width="4"/>
          <text x="234" y="142" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">CONVERSATION</text>
          <path d="M298 100 H338" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
          <path d="M338 100 L324 92 M338 100 L324 108" stroke="var(--ink)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Message card -->
          <rect x="346" y="56" width="120" height="100" rx="16" fill="var(--green-dk)"/>
          <rect x="340" y="50" width="120" height="100" rx="16" fill="var(--green)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="348" y="58" width="44" height="18" rx="9" fill="#ffffff" opacity="0.28" transform="rotate(-18 370 67)"/>
          <rect x="366" y="84" width="68" height="42" rx="8" fill="#ffffff" stroke="var(--ink)" stroke-width="4"/>
          <line x1="374" y1="98" x2="426" y2="98" stroke="var(--ink)" stroke-width="3"/>
          <line x1="374" y1="108" x2="410" y2="108" stroke="var(--ink)" stroke-width="3"/>
          <text x="400" y="142" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">MESSAGE</text>
        </svg>
      </div>
