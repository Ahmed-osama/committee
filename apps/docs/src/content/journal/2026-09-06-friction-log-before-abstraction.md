---
title: 'Let a friction log decide what gets extracted, not a guess'
date: 2026-09-06
tags: ['architecture', 'ai']
entryId: '2026-09-06-friction-log-before-abstraction'
---

<p>Bootstrapping <code>apps/digest</code> as a second app on top of <code>packages/core</code>
      (COM-10) started from a guess: the two apps' session storage and provider routing looked
      similar enough to share an <code>LLMClient</code>/<code>SessionStore</code> abstraction.
      Instead of building that abstraction speculatively, the work logged real friction as it
      happened (<code>apps/digest/FRICTION.md</code>), then wrote down what actually diverged
      between the two apps' session and routing needs (<code>packages/core/DIVERGENCE.md</code>,
      COM-11) before touching shared code.</p>
      <p>The friction log turned out to name only two things as genuinely duplicated with zero
      divergence: a provider-fallback function and a shared model-by-provider map. Those got
      extracted into <code>packages/core</code> (COM-12) — <code>generateForAgent</code> now
      retries across an agent's configured provider list on failure, marking each one down via
      <code>markProviderDown</code> so the next attempt steers around it, and <code>apps/digest</code>
      picked up that retry behavior for free just by calling the shared function instead of its
      own hand-rolled <code>selectProvider → PROVIDER_REGISTRY → generateText</code> chain. The
      bigger session/store abstraction the original task assumed was needed never got built —
      <code>DIVERGENCE.md</code> showed the two apps' needs aren't actually shaped alike yet.
      This is the "rule of three" instinct made procedural: write down where the duplication
      really is and isn't before reaching for a shared abstraction, so the abstraction boundary
      follows evidence instead of a first impression.</p>
      <div class="reading">
        <span class="label">Further reading</span>
        <ul><li>Sandi Metz, "The Wrong Abstraction" — on the cost of extracting shared code too early and how to back out of it</li></ul>
      </div>
