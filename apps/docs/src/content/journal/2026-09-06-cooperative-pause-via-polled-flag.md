---
title: "Pausing an async loop: poll a flag, don't block on a promise"
date: 2026-09-06
tags: ['ai', 'node', 'architecture']
entryId: '2026-09-06-cooperative-pause-via-polled-flag'
---

<p><code>runPlanningSession</code> in
      <code>packages/core/src/conversation/planning-session.ts</code> needed a "pause" that a
      human can trigger mid-debate and later resume. The implementation isn't a
      <code>Promise</code> the pause handler resolves — it's a plain module-level
      registry (<code>packages/core/src/orchestrator/pause-registry.ts</code>) holding a
      set of paused conversation IDs, checked at the top of each turn:</p>

```ts
if (isPaused?.(conversationId)) {
  onPausedChange?.(true);
  while (isPaused?.(conversationId)) {
    if (isStopRequested?.(conversationId))
      return { finalized: false, turnsUsed: turn, stopped: true };
    await sleep(500);
  }
  onPausedChange?.(false);
}
```

<p>This is a deliberate trade: a promise-based pause (resolve a stored "resume" promise
      from the HTTP handler) would react instantly and use zero CPU while waiting, but it
      couples the request handler to a live in-memory reference for that specific run — awkward
      once you also want <code>stop</code> to interrupt the same wait, and fragile across process
      boundaries. Polling a flag every 500ms is slightly wasteful and adds up to half a second of
      latency on resume, but it composes trivially: <code>stop</code> and <code>pause</code> are
      just two independent registries checked from the same loop, and either one can be flipped
      from any HTTP request with no shared promise plumbing. For a human-in-the-loop control this
      coarse (pause/resume happen on the order of seconds, not milliseconds), the simplicity is
      worth more than the theoretical responsiveness a promise would buy.</p>
