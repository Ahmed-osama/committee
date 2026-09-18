---
title: 'Operator role: assisted mode without write access'
order: 4
---

<p>COM-35 gives a human staffer a way to help a caller over the phone without ever
      being able to act as that caller. <code>operator</code> is a third plain role
      (alongside <code>user</code>/<code>admin</code>) checked by
      <code>requireOperatorSession()</code>; <code>(operator)/operator/</code> is a
      third sibling root layout, unlocalized internal tooling like COM-24's admin
      dashboard. Its page looks up an account by phone and shows listings/
      negotiations/deals — read queries only, nothing there can start or answer a
      negotiation or confirm a deal. The one write path is deliberately narrow: a
      dropdown of seeded <code>canned_scripts</code> (never free text) logs which
      script the operator played into the append-only <code>assisted_session_logs</code>
      audit table, visible read-only on the admin dashboard.</p>
      <p>The interesting fix here is structural rather than incidental: the three
      transacting routes (<code>negotiations</code> open/respond,
      <code>deals/[id]/confirm</code>) now reject <code>role === 'operator'</code>
      outright before any other check, stating the business rule directly instead of
      relying on the party check (an operator is never the buyer/seller on record) to
      happen to produce the same result. The e2e spec asserts that explicit 403, not
      just that the operator's UI has no button for it — deny-by-role, not deny-by-
      incidental-exclusion. A real bug surfaced while wiring the new role in:
      <code>SessionPayload</code> and <code>verifySessionToken</code> had
      <code>'user' | 'admin'</code> hardcoded, so adding <code>operator</code> to the
      DB enum alone would have silently rejected every operator session token.</p>
      <div class="art">
        <svg viewBox="0 0 440 240" width="440" height="240">
          <rect width="440" height="240" fill="#ffffff"/>
          <rect x="24" y="76" width="110" height="88" rx="14" fill="var(--blue-dk)" transform="translate(4,4)"/>
          <rect x="20" y="72" width="110" height="88" rx="14" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
          <circle cx="75" cy="102" r="16" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
          <path d="M55 140 Q75 118 95 140" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
          <path d="M62 96 Q75 84 88 96" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
          <text x="75" y="156" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">OPERATOR</text>
          <path d="M134 108 L182 108" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M182 108 L172 100 M182 108 L172 116" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <rect x="188" y="60" width="120" height="96" rx="14" fill="var(--green-dk)" transform="translate(4,4)"/>
          <rect x="184" y="56" width="120" height="96" rx="14" fill="var(--green)" stroke="var(--ink)" stroke-width="5"/>
          <ellipse cx="205" cy="70" rx="10" ry="5" fill="#ffffff" opacity="0.4" transform="rotate(-20 205 70)"/>
          <ellipse cx="244" cy="104" rx="22" ry="14" fill="#ffffff" stroke="var(--ink)" stroke-width="3"/>
          <circle cx="244" cy="104" r="6" fill="var(--ink)"/>
          <text x="244" y="140" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">READ-ONLY</text>
          <rect x="316" y="52" width="100" height="72" rx="12" fill="var(--coral-dk)" transform="translate(4,4)"/>
          <rect x="312" y="48" width="100" height="72" rx="12" fill="var(--coral)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="336" y="66" width="28" height="22" rx="4" fill="var(--cream)" stroke="var(--ink)" stroke-width="3"/>
          <path d="M340 66 v-8 a10 10 0 0 1 20 0 v8" stroke="var(--ink)" stroke-width="3" fill="none"/>
          <text x="362" y="112" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="9" fill="var(--ink)">NO NEGOTIATE</text>
          <text x="362" y="122" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="9" fill="var(--ink)">NO CONFIRM</text>
          <rect x="316" y="150" width="100" height="46" rx="10" fill="var(--yellow-dk)" transform="translate(3,3)"/>
          <rect x="313" y="147" width="100" height="46" rx="10" fill="var(--yellow)" stroke="var(--ink)" stroke-width="4"/>
          <text x="363" y="167" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="9" fill="var(--ink)">SCRIPT ID</text>
          <text x="363" y="180" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="9" fill="var(--ink)">→ AUDIT LOG</text>
          <path d="M244 152 L244 168 Q244 178 274 178 L302 178" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="2 7"/>
          <path d="M302 178 L294 172 M302 178 L294 184" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
          <text x="120" y="24" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">NARRATES ACCOUNT STATE, NEVER ACTS ON IT</text>
        </svg>
      </div>
