---
title: 'When a loop times out, force a degraded result instead of returning nothing'
date: 2026-09-06
tags: ['ai', 'architecture']
entryId: '2026-09-06-forced-finalization-over-empty-result'
---

<p><code>packages/core/src/conversation/planning-session.ts</code> runs a fixed
      turn budget (<code>maxTurns</code>) for the Planner/Architect/Skeptic debate.
      Originally, if the skeptic never agreed before the budget ran out, the whole
      conversation just returned <code>{ finalized: false }</code> — a potentially
      long, costly LLM conversation producing literally nothing usable. The fix adds
      two layers: a <code>CLOSING_PHASE_FRACTION</code> (75%) past which the skeptic
      is told to agree unless there's a genuinely critical objection, and — if the
      loop still exhausts every turn with no plan — one forced extra call that
      instructs the finalizer agent to call <code>finalize_plan</code> immediately
      from whatever was discussed, no further debate allowed.</p>
      <p>The general pattern is worth naming: for any agent loop with a hard turn or
      time budget, decide up front what happens at the boundary. The naive default —
      let the budget run out and report failure — throws away all the (expensive)
      partial progress. Nudging behavior as the deadline approaches (the closing-phase
      prompt change) is cheap and often enough on its own; keeping a forced fallback
      call as a last resort means the *worst* case is "an imperfect plan from a real
      transcript," not "nothing, after burning the whole budget." The same shape shows
      up in agentic coding tools that force a summary/wrap-up turn when they're about
      to hit a context or step limit.</p>
