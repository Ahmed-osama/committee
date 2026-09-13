---
title: 'Orchestrator plumbing'
order: 5
---

<p>A running planning session is a plain in-process <code>for</code>
      loop with nothing else attached to it. <code>injection-queue.ts</code>
      and <code>stop-registry.ts</code> are the minimal shared mutable stores
      that let an HTTP request — "inject this text" / "stop this
      conversation" — reach a loop it isn't otherwise connected to.
      <code>EventBus</code> is the other direction: the loop publishes each
      message as it happens, and the web viewer's SSE endpoint just
      subscribes — a pure observer bolted on top, not something the engine
      needs to know exists.</p>
      <div class="art">
        <svg viewBox="0 0 440 220" width="440" height="220">
          <rect width="440" height="220" fill="#ffffff"/>
          <rect x="14" y="80" width="112" height="58" rx="14" fill="var(--purple-dk)" transform="translate(4,4)"/>
          <rect x="10" y="76" width="112" height="58" rx="14" fill="var(--purple)" stroke="var(--ink)" stroke-width="4"/>
          <rect x="18" y="82" width="40" height="14" rx="7" fill="#ffffff" opacity="0.3"/>
          <text x="66" y="112" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">HTTP REQUEST</text>
          <!-- mailbox / queue -->
          <g transform="translate(203,66)">
            <path d="M4 44 V20 A30 30 0 0 1 64 20 V44 Z" fill="var(--yellow-dk)"/>
            <path d="M0 40 V16 A30 30 0 0 1 60 16 V40 Z" fill="var(--yellow)" stroke="var(--ink)" stroke-width="5"/>
            <rect x="-6" y="40" width="72" height="14" rx="4" fill="var(--yellow)" stroke="var(--ink)" stroke-width="5"/>
            <rect x="20" y="4" width="20" height="14" fill="#ffffff" stroke="var(--ink)" stroke-width="3"/>
            <ellipse cx="14" cy="14" rx="9" ry="5" fill="#ffffff" opacity="0.35"/>
          </g>
          <text x="233" y="148" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">QUEUE / BUS</text>
          <rect x="304" y="80" width="112" height="58" rx="14" fill="var(--blue-dk)" transform="translate(4,4)"/>
          <rect x="300" y="76" width="112" height="58" rx="14" fill="var(--blue)" stroke="var(--ink)" stroke-width="4"/>
          <rect x="308" y="82" width="40" height="14" rx="7" fill="#ffffff" opacity="0.3"/>
          <text x="356" y="112" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">RUNNING LOOP</text>
          <path d="M124 105 H192" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
          <path d="M192 105 L180 98 M192 105 L180 112" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M298 105 H230" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
          <path d="M230 105 L242 98 M230 105 L242 112" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
