---
title: "`SELECT ... FOR UPDATE`: locking the row you're about to read-then-write"
date: 2026-09-12
tags: ['node', 'architecture']
entryId: '2026-09-12-select-for-update-lost-updates'
---

<p>GroundTruth's negotiation, deal-closure, and credit-purchase flows
      (<code>apps/web/src/lib/negotiations/negotiations.ts</code>,
      <code>lib/deals/deals.ts</code>, <code>lib/payments/credits.ts</code>) all share one
      shape: read a row, decide the next state in application code, then write it back —
      and every one of them wraps that in <code>pooledDb.transaction(async (tx) =&gt; {
      ... .for('update') ... })</code> rather than a plain <code>db</code> query. The reason
      is the classic "lost update" race: without a lock, two near-simultaneous requests
      (buyer accepts while seller counters; both parties confirm a deal within the same
      millisecond; a webhook retries mid-processing) can both <code>SELECT</code> the same
      pre-write snapshot, both compute a "next state" from it, and the second write silently
      clobbers the first — no error, just a wrong final state.</p>
      <p><code>.for('update')</code> (Postgres's row-level lock, exposed by Drizzle) closes
      that window: the first transaction to reach the <code>SELECT</code> holds an exclusive
      lock on that row until it commits, so a second transaction trying to select the same
      row for update simply blocks until the first finishes — then re-reads the *post-write*
      state, and the state machine correctly rejects the now-stale action instead of both
      succeeding. This only works because the read and the write happen inside the same
      transaction against the same row; locking in a separate statement from the write
      doesn't help. It's a narrow tool — reach for it specifically when "read a row to decide
      how to write it" can happen twice concurrently for the same row, not as a default for
      every query.</p>
      <div class="reading">
        <span class="label">Further reading</span>
        <ul><li>PostgreSQL docs, "Explicit Locking" §13.3.2 (Row-level Locks) — covers
        <code>FOR UPDATE</code> vs. <code>FOR SHARE</code> and when each applies.</li></ul>
      </div>
