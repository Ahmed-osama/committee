---
title: 'Provider routing'
order: 4
---

<p>All roles share one canonical strength ordering. <code>selectProvider</code>
      walks it and returns the first entry that's configured, not rate-limited,
      and under the daily call/spend ceilings. <code>rotateProviderOrder</code>
      rotates the same list per role so the committee spreads across providers
      instead of every role fighting over the single strongest one:</p>

```ts
// packages/core/src/provider/provider-router.ts
export const PROVIDER_STRENGTH_ORDER = [
  'anthropic',
  'gemini',
  'groq',
  'sambanova',
  'cerebras',
  'deepseek',
  'glm',
  'mistral',
  'nvidia-nim',
  'openrouter',
  'perplexity',
  'cohere',
  'ollama',
];

export function rotateProviderOrder(offset: number): string[] {
  const n = PROVIDER_STRENGTH_ORDER.length;
  const start = ((offset % n) + n) % n;
  return [...PROVIDER_STRENGTH_ORDER.slice(start), ...PROVIDER_STRENGTH_ORDER.slice(0, start)];
}
```

<p>SambaNova and NVIDIA NIM were early free-tier additions, and Cerebras/Mistral/Cohere
      followed the same scout-and-onboard path. <code>nvidia-nim</code> shares one ~40
      req/min ceiling across every model on the key; <code>sambanova</code>'s is 20
      req/min per model. Both SambaNova and Cerebras are live-tested but currently
      unusable — real calls hit <code>PAYMENT_METHOD_REQUIRED</code> despite third-party
      "no card needed" claims. They stay in the strength order for when that's resolved,
      but can't actually serve a turn today — the recurring lesson being: don't trust a
      free-tier claim until a real key completes a real call.</p>
      <div class="art">
        <svg viewBox="0 0 340 260" width="340" height="260">
          <rect width="340" height="260" fill="#ffffff"/>
          <rect x="46" y="14" width="180" height="42" rx="12" fill="var(--coral-dk)" transform="translate(4,4)"/>
          <rect x="46" y="14" width="180" height="42" rx="12" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
          <rect x="54" y="20" width="60" height="12" rx="6" fill="#ffffff" opacity="0.3"/>
          <text x="136" y="41" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">ANTHROPIC</text>
          <line x1="194" y1="24" x2="218" y2="48" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
          <line x1="218" y1="24" x2="194" y2="48" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
          <rect x="46" y="72" width="180" height="42" rx="12" fill="var(--coral-dk)" transform="translate(4,4)"/>
          <rect x="46" y="72" width="180" height="42" rx="12" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
          <rect x="54" y="78" width="60" height="12" rx="6" fill="#ffffff" opacity="0.3"/>
          <text x="136" y="99" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">GEMINI</text>
          <line x1="194" y1="82" x2="218" y2="106" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
          <line x1="218" y1="82" x2="194" y2="106" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
          <rect x="46" y="130" width="180" height="42" rx="12" fill="var(--green-dk)" transform="translate(4,4)"/>
          <rect x="46" y="130" width="180" height="42" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="4"/>
          <rect x="54" y="136" width="60" height="12" rx="6" fill="#ffffff" opacity="0.3"/>
          <text x="136" y="157" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">GROQ</text>
          <path d="M200 152 l10 10 l18 -20" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="74" y="190" width="124" height="34" rx="10" fill="var(--cream)" stroke="var(--ink)" stroke-width="3" opacity="0.85"/>
          <text x="136" y="212" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">…FALLBACK CHAIN</text>
          <path d="M22 36 V162" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" fill="none"/>
          <path d="M22 162 L12 146 M22 162 L32 146" stroke="var(--ink)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
