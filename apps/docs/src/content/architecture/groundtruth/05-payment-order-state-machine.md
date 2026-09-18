---
title: 'Buyer-to-seller payments: the order state machine'
order: 5
---

<p>COM-54 planned buyer-to-seller phone payments (a buyer paying a seller directly
for a deal deposit, via Paymob's mobile-wallet flow) — distinct from the existing
credit ledger, which is sellers/buyers paying the <em>platform</em> for a contact
reveal. COM-55 was the M0 spike: try to confirm how Paymob itself dedupes two
concurrent authorization attempts for the same order. No sandbox account exists yet
(that's COM-56, merchant onboarding, still open), so the spike couldn't run that
test. Its binding instruction was to not wait on the answer — build the idempotency
guard at the DB level regardless of what Paymob does or doesn't do on its own.</p>
<p>The guard is a unique constraint on <code>payment_orders.merchant_order_id</code>.
<code>createPaymentOrder</code> inserts with <code>onConflictDoNothing</code> and
re-selects on conflict, so two callers racing for the same order both get back the
same single row — never a thrown error for the loser. Around that sits a small pure
state machine (<code>payment-order-state-machine.ts</code>, split from DB access the
same way COM-19/20 split theirs): <code>pending_authorization</code> →
<code>awaiting_webhook_confirmation</code> (a 30-minute deadline) →
<code>confirmed</code> or <code>refunded_timeout</code>. The one case that must never
happen is a webhook confirming success after the order already timed out — that
throws <code>LateSettlementError</code> instead of flipping the row back to
confirmed, and the caller opens a <code>late_settlement_reconciliations</code> row
(no FK cascade — it has to outlive the order) for a human to reconcile by hand.</p>
<p>Nothing here is wired to a real checkout or webhook route yet — that needs a
<code>PaymobPaymentProvider</code> adapter and real credentials, both blocked on
COM-56. This spike only had to prove the idempotency mechanism and land the schema
it depends on.</p>
<div class="art">
<svg viewBox="0 0 460 240" width="460" height="240">
<rect width="460" height="240" fill="#ffffff"/>
<rect x="16" y="98" width="112" height="52" rx="12" fill="var(--blue-dk)" transform="translate(3,3)"/>
<rect x="13" y="95" width="112" height="52" rx="12" fill="var(--blue)" stroke="var(--ink)" stroke-width="4"/>
<text x="69" y="117" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">PENDING</text>
<text x="69" y="131" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">AUTHORIZATION</text>
<path d="M128 121 L172 121" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M172 121 L162 114 M172 121 L162 128" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="176" y="98" width="120" height="52" rx="12" fill="var(--yellow-dk)" transform="translate(3,3)"/>
<rect x="173" y="95" width="120" height="52" rx="12" fill="var(--yellow)" stroke="var(--ink)" stroke-width="4"/>
<text x="233" y="117" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">AWAITING</text>
<text x="233" y="131" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">WEBHOOK (30M)</text>
<path d="M296 112 L340 90" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M340 90 L328 90 M340 90 L336 100" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="342" y="46" width="102" height="46" rx="12" fill="var(--green-dk)" transform="translate(3,3)"/>
<rect x="339" y="43" width="102" height="46" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="4"/>
<text x="390" y="70" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">CONFIRMED</text>
<path d="M296 132 L340 156" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M340 156 L332 148 M340 156 L330 158" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="342" y="150" width="102" height="46" rx="12" fill="var(--coral-dk)" transform="translate(3,3)"/>
<rect x="339" y="147" width="102" height="46" rx="12" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
<text x="390" y="169" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">REFUNDED</text>
<text x="390" y="181" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">TIMEOUT</text>
<path d="M390 43 L390 20" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="2 6"/>
<path d="M390 20 L410 34" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M410 34 L402 27 M410 34 L400 32" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
<text x="308" y="14" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">LATE WEBHOOK -&gt; ERROR, NEVER FLIPS BACK</text>
<ellipse cx="30" cy="105" rx="8" ry="4" fill="#ffffff" opacity="0.4" transform="rotate(-20 30 105)"/>
<ellipse cx="190" cy="105" rx="8" ry="4" fill="#ffffff" opacity="0.4" transform="rotate(-20 190 105)"/>
<ellipse cx="355" cy="52" rx="7" ry="3.5" fill="#ffffff" opacity="0.4" transform="rotate(-20 355 52)"/>
<ellipse cx="355" cy="156" rx="7" ry="3.5" fill="#ffffff" opacity="0.4" transform="rotate(-20 355 156)"/>
<rect x="50" y="206" width="360" height="30" rx="9" fill="var(--purple-dk)" transform="translate(3,3)"/>
<rect x="47" y="203" width="360" height="30" rx="9" fill="var(--purple)" stroke="var(--ink)" stroke-width="4"/>
<text x="227" y="223" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">DB UNIQUE CONSTRAINT, NOT PAYMOB, IS THE IDEMPOTENCY GUARD</text>
</svg>
</div>
