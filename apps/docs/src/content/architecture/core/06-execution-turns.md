---
title: 'Execution turns'
order: 6
---

<p>Once a plan is finalized (or the session otherwise ends), a human can
      type a command against the real codebase.
      <code>runExecutionTurn</code> (<code>execution/execute-command.ts</code>)
      is deliberately a different code path from the planning loop: one
      agent, real <code>run_command</code> / <code>read_file</code> /
      <code>write_file</code> tools, capped at 8 steps — action, not another
      round of debate.</p>
      <div class="art">
        <svg viewBox="0 0 360 220" width="360" height="220">
          <rect width="360" height="220" fill="#ffffff"/>
          <rect x="24" y="48" width="200" height="126" rx="14" fill="#000000" transform="translate(4,4)"/>
          <rect x="20" y="44" width="200" height="126" rx="14" fill="#2b2b2b" stroke="var(--ink)" stroke-width="5"/>
          <circle cx="34" cy="58" r="4" fill="var(--coral)"/>
          <circle cx="46" cy="58" r="4" fill="var(--yellow)"/>
          <circle cx="58" cy="58" r="4" fill="var(--green)"/>
          <rect x="30" y="72" width="180" height="86" rx="6" fill="#0e0e0e"/>
          <text x="42" y="98" font-family="monospace" font-weight="bold" font-size="15" fill="var(--green)">$ run_command</text>
          <text x="42" y="120" font-family="monospace" font-weight="bold" font-size="15" fill="var(--cream)">$ read_file</text>
          <text x="42" y="142" font-family="monospace" font-weight="bold" font-size="15" fill="var(--cream)">$ write_file</text>
          <!-- wrench -->
          <g transform="translate(288,108) rotate(35)">
            <rect x="-6" y="-38" width="16" height="60" rx="8" fill="var(--coral-dk)" transform="translate(3,3)"/>
            <rect x="-8" y="-40" width="16" height="60" rx="8" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
            <circle cx="2" cy="-38" r="18" fill="var(--coral-dk)"/>
            <circle cx="0" cy="-40" r="18" fill="none" stroke="var(--ink)" stroke-width="6"/>
            <circle cx="0" cy="-40" r="18" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
            <ellipse cx="-6" cy="-46" rx="6" ry="3.5" fill="#ffffff" opacity="0.45"/>
            <rect x="-18" y="-58" width="12" height="14" fill="#ffffff"/>
            <rect x="6" y="-58" width="12" height="14" fill="#ffffff"/>
          </g>
        </svg>
      </div>
