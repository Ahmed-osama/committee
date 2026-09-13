---
title: 'KYC gate and the E2E regression guard'
order: 3
---

<p>COM-18 (KYC submission + private-bucket storage) was marked Done, but no page
      ever linked to it — a seller hit a static "verification required" message with
      no way forward, making COM-17's listing creation an unreachable dead end. A
      backend endpoint working in isolation isn't the same as a user being able to
      reach it, and unit/typecheck runs can't catch that gap since there's no browser
      in the loop. <code>(site)/[locale]/account/kyc/</code> closes it: <code>page.tsx</code>
      reads <code>getLatestKycStatus</code> (none/pending/approved/rejected) and
      <code>kyc-form.tsx</code> posts document + selfie straight to the existing
      <code>/api/kyc/submit</code>, which now gates specifically on
      <code>kyc.status === 'approved'</code> rather than a submission merely existing.
      Approval itself starts as manual admin review through the existing COM-24 queue
      for the first micro-zone, since early sellers are personally known to the
      founder — real vendor sandbox validation is deferred as a fast-follow.</p>
      <p>Since this exact class of bug (shipped backend, no reachable UI) is what
      slipped through before, the fix ships with its own regression guard rather than
      trusting it not to happen again: Playwright (<code>e2e/</code>,
      <code>playwright.config.ts</code>, Chromium-only — a single phone-first
      audience, not a cross-browser target) drives a real browser through login OTP →
      KYC submit → approval → the listing form actually becoming reachable. It runs
      via <code>pnpm --filter @committee/web test:e2e</code> against a live dev server
      and DB, separate from the cacheable Turbo <code>test</code> task that only runs
      fast unit tests.</p>
      <div class="art">
        <svg viewBox="0 0 440 230" width="440" height="230">
          <rect width="440" height="230" fill="#ffffff"/>
          <rect x="16" y="90" width="100" height="56" rx="12" fill="var(--purple-dk)" transform="translate(3,3)"/>
          <rect x="13" y="87" width="100" height="56" rx="12" fill="var(--purple)" stroke="var(--ink)" stroke-width="4"/>
          <text x="63" y="119" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">KYC UPLOAD</text>
          <path d="M116 115 L176 115" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <rect x="180" y="90" width="100" height="56" rx="12" fill="var(--yellow-dk)" transform="translate(3,3)"/>
          <rect x="177" y="87" width="100" height="56" rx="12" fill="var(--yellow)" stroke="var(--ink)" stroke-width="4"/>
          <text x="227" y="112" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">ADMIN</text>
          <text x="227" y="126" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">REVIEW</text>
          <path d="M280 115 L340 115" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <rect x="344" y="90" width="80" height="56" rx="12" fill="var(--green-dk)" transform="translate(3,3)"/>
          <rect x="341" y="87" width="80" height="56" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="4"/>
          <text x="381" y="119" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">LISTING</text>
          <ellipse cx="30" cy="98" rx="8" ry="4" fill="#ffffff" opacity="0.4" transform="rotate(-20 30 98)"/>
          <ellipse cx="194" cy="98" rx="8" ry="4" fill="#ffffff" opacity="0.4" transform="rotate(-20 194 98)"/>
          <ellipse cx="358" cy="98" rx="6" ry="3" fill="#ffffff" opacity="0.4" transform="rotate(-20 358 98)"/>
          <path d="M40 30 Q220 6 400 30" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="2 8"/>
          <path d="M400 30 L392 22 M400 30 L390 34" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
          <text x="220" y="20" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">PLAYWRIGHT WALKS THE WHOLE PATH</text>
          <rect x="60" y="176" width="320" height="34" rx="10" fill="var(--coral-dk)" transform="translate(3,3)"/>
          <rect x="57" y="173" width="320" height="34" rx="10" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
          <text x="217" y="196" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">"DONE" BACKEND ≠ REACHABLE UI</text>
        </svg>
      </div>
