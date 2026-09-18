---
title: 'Making a race idempotent with a unique constraint, not a lock'
date: 2026-09-14
tags: ['node', 'architecture']
entryId: '2026-09-14-idempotent-insert-via-unique-constraint'
---

GroundTruth's earlier state-machine flows (the negotiation/deal/credit code, covered in this journal's "`SELECT ... FOR UPDATE`" entry) all handle races by locking an *existing* row before deciding how to write it. `createPaymentOrder` in `apps/web/src/lib/payments/orders.ts` (COM-55) faces a different shape of race: two callers might try to *create* the row for the same payment attempt at the same time, so there's no row yet to lock. Locking can't help you serialize an insert that hasn't happened.

The fix is to let Postgres's own unique constraint on `payment_orders.merchant_order_id` be the single source of truth for "has this attempt already started," and make the losing side of the race a normal, resolvable outcome rather than an error: insert with `.onConflictDoNothing({ target: paymentOrders.merchantOrderId })`, and if that returns nothing, re-select the row by the same key. Both racing callers end up returning the identical row — one created it, one just read it back — with neither seeing a thrown constraint-violation exception. This only works because "someone already started this exact attempt" is an expected, benign outcome here (unlike, say, a duplicate username), so collapsing the race into a shared read is the right semantics, not a workaround.

The general lesson: when two concurrent writers might both try to *originate* the same logical entity, reach for a DB-level uniqueness guarantee plus a do-nothing-and-reread pattern, not application-level locking — locking only serializes access to something that already exists.

<div class="reading">
<span class="label">Further reading</span>
<ul><li>PostgreSQL docs, "INSERT ... ON CONFLICT" — the DO NOTHING vs. DO UPDATE tradeoffs this pattern relies on.</li></ul>
</div>
