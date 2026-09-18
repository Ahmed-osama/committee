---
title: 'Two layers of provider fallback: quota tracking vs. failure cooldown'
date: 2026-09-05
tags: ['ai', 'architecture']
entryId: '2026-09-05-proactive-and-reactive-rate-limiting'
---

<p><code>provider-router.ts</code>'s <code>selectProvider</code> checks a rate-limit
      tracker <em>before</em> ever calling a provider — it knows the configured request/day
      and token/day budgets and refuses to pick a provider it expects to be exhausted. But
      that's a static model of the world; a free-tier quota can be stricter in practice than
      what's configured, or a provider can just be down. So <code>generate-for-agent.ts</code>
      wraps the actual call in a loop: on failure it calls <code>markProviderDown</code>
      (<code>provider-health.ts</code>) to set a 5-minute in-memory cooldown keyed by
      <code>providerId:modelId</code>, then retries the <em>next</em> entry in the agent's
      provider preference list. The next call to <code>selectProvider</code> sees that
      cooldown via <code>isProviderDown</code> and skips it automatically.</p>
      <p>The split matters: the proactive tracker prevents wasting calls on a provider you
      already know is over budget, while the reactive cooldown handles the failures you
      can't predict from your own bookkeeping. This is the same shape as a circuit
      breaker — a failure trips a breaker that stays open for a fixed window, so the system
      routes around a bad dependency without hammering it, and self-heals once the window
      elapses. Neither layer alone is enough: proactive-only misses real-world surprises,
      reactive-only wastes calls discovering limits you already knew about.</p>
      <div class="reading">
        <span class="label">Further reading</span>
        <ul>
          <li>Martin Fowler's <em>"CircuitBreaker"</em> pattern write-up — the classic
          description of trip/cooldown/retry that this in-memory <code>downUntil</code> map
          is a minimal version of.</li>
        </ul>
      </div>
