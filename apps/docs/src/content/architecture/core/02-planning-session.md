---
title: 'Planning session'
order: 2
---

<p><code>runPlanningSession</code> (in <code>conversation/planning-session.ts</code>)
      is a round-robin loop, not a single agent's tool loop: each turn hands the
      full transcript to the next agent in order. Only the designated finalizer
      can end it, and only once the Skeptic has explicitly called
      <code>agree</code> — not just gone quiet — and has raised at least
      2 real challenges first. That floor exists because on the first real
      run, the plan finalized before the Skeptic had said anything at all.</p>
      <p>Two later fixes target the opposite failure — a debate that never
      converges. Past 75% of the turn budget the loop enters a "closing
      phase": prompts push agents to converge instead of opening new
      threads, and once the Skeptic is eligible to agree, the finalizer's
      <code>finalize_plan</code> call (and, late in the closing phase, the
      Skeptic's <code>agree</code> call) is <em>forced</em> via
      <code>toolChoice</code> rather than left to the model's discretion —
      agents were observed writing "finalize_plan" as prose instead of
      actually calling the tool, stalling until the budget ran out. If the
      budget still runs out with no agreement, the finalizer gets one last
      forced call to commit to a best-effort plan from whatever was
      discussed, rather than reporting no plan at all.</p>
      <p>The loop also takes a human mid-debate: the web viewer's pause
      button blocks the loop at the top of its next turn
      (<code>isPaused</code>/<code>onPausedChange</code>), and sending a
      message resumes it automatically. A finalized conversation isn't a
      dead end either — "reopen &amp; regenerate" seeds a fresh session with
      the old transcript as <code>initialTranscript</code>, continuing turn
      numbers from <code>startTurn</code>, so new human feedback can reopen
      and re-finalize the same conversation instead of starting over.</p>
      <div class="art">
        <svg viewBox="0 0 460 260" width="460" height="260">
          <rect width="460" height="260" fill="#ffffff"/>
          <!-- circular arrow -->
          <path d="M160 70 A85 85 0 1 1 113 205" fill="none" stroke="var(--blue-dk)" stroke-width="12" stroke-linecap="round"/>
          <path d="M160 70 A85 85 0 1 1 113 205" fill="none" stroke="var(--blue)" stroke-width="9" stroke-linecap="round"/>
          <path d="M113 205 L99 186 M113 205 L96 210" stroke="var(--blue-dk)" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- agent heads around the loop -->
          <circle cx="164" cy="72" r="19" fill="var(--cream-dk)" transform="translate(3,4)"/>
          <circle cx="164" cy="72" r="19" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <ellipse cx="157" cy="65" rx="6" ry="4" fill="#ffffff" opacity="0.6"/>
          <circle cx="242" cy="56" r="19" fill="var(--coral-dk)" transform="translate(3,4)"/>
          <circle cx="242" cy="56" r="19" fill="var(--coral)" stroke="var(--ink)" stroke-width="4"/>
          <ellipse cx="235" cy="49" rx="6" ry="4" fill="#ffffff" opacity="0.6"/>
          <circle cx="246" cy="162" r="19" fill="var(--cream-dk)" transform="translate(3,4)"/>
          <circle cx="246" cy="162" r="19" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <ellipse cx="239" cy="155" rx="6" ry="4" fill="#ffffff" opacity="0.6"/>
          <text x="164" y="38" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">PLANNER</text>
          <text x="242" y="26" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">SKEPTIC</text>
          <text x="278" y="162" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">ARCHITECT</text>
          <!-- gate: shield + check -->
          <g transform="translate(352,165)">
            <path d="M4 -26 L32 -14 V14 Q32 38 4 50 Q-24 38 -24 14 V-14 Z" fill="var(--green-dk)"/>
            <path d="M0 -30 L28 -18 V10 Q28 34 0 46 Q-28 34 -28 10 V-18 Z" fill="var(--green)" stroke="var(--ink)" stroke-width="5"/>
            <ellipse cx="-10" cy="-14" rx="8" ry="5" fill="#ffffff" opacity="0.35" transform="rotate(-20 -10 -14)"/>
            <path d="M-12 6 L-2 18 L16 -8" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <text x="352" y="232" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">SKEPTIC AGREES</text>
          <path d="M280 165 H312" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
          <path d="M312 165 L298 157 M312 165 L298 173" stroke="var(--ink)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
