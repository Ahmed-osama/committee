---
title: 'Bridging an HTTP handler into a plain in-process loop'
date: 2026-09-05
tags: ['node', 'architecture']
entryId: '2026-09-05-shared-mutable-store-http-to-loop'
---

<p><code>orchestrator/injection-queue.ts</code> and <code>stop-registry.ts</code> solve
      the same small problem two ways: a running planning session is just a <code>for</code>
      loop in one Node process, with no event emitter, message channel, or polling hook of
      its own. But the web server's "inject a message" and "stop" endpoints are separate HTTP
      requests that need to reach into that loop from outside. Rather than restructure the
      loop into something event-driven, both files use the simplest thing that works: a
      module-level <code>Map</code>/<code>Set</code> keyed by conversation id. The HTTP
      handler writes into it (<code>enqueue</code>, <code>requestStop</code>); the loop reads
      from it at the top of its next turn (<code>drain</code>, <code>isStopRequested</code>).</p>
      <p>This only works because both sides live in the same process and the loop already
      polls itself once per turn — there's a natural checkpoint to read the mutable state
      without needing real concurrency primitives. It would break the moment the server and
      the loop run in separate processes (a worker, a serverless function, multiple server
      instances behind a load balancer), at which point the same idea needs an actual queue
      or pub/sub. Recognizing "same process, already has a loop tick" as the condition that
      makes a module-level `Map` an acceptable shared-state mechanism — rather than reaching
      for it out of habit — is the actual transferable lesson.</p>
