---
title: 'When a model narrates a tool call instead of making one'
date: 2026-09-06
tags: ['ai', 'architecture']
entryId: '2026-09-06-force-tool-choice-at-agreement'
---

<p>The Planner/Architect/Skeptic debate in
      <code>packages/core/src/conversation/planning-session.ts</code> was stalling: once the
      skeptic had genuinely agreed, the finalizer's only sanctioned move was to call
      <code>finalize_plan</code>, and the closing-phase prompt told the skeptic to call
      <code>agree</code> rather than raise new objections — but agents kept writing the literal
      words <code>finalize_plan</code> or "I agree" as plain text instead of invoking the actual
      tool. Offering a tool doesn't make the model use it; by default (<code>toolChoice:
      'auto'</code> in the Vercel AI SDK's <code>generateText</code>) the model is still free to
      answer in prose, and once it's talked itself into treating the decision as already made,
      it has little incentive to also emit a structured call.</p>
      <p>The fix, threaded through as a new <code>toolChoice</code> option on
      <code>generateForAgent</code> (<code>packages/core/src/provider/generate-for-agent.ts</code>),
      is to stop asking and start requiring: at the exact points where the caller already knows
      the tool call is the only valid next action, pass <code>{ type: 'tool', toolName:
      'finalize_plan' }</code> instead of leaving the tool set open-ended. This is a general
      rule for any tool-using agent loop — reserve free-form <code>auto</code> choice for turns
      where the model genuinely has options, and force a specific tool the moment your own code
      already knows there's exactly one legitimate action left. Leaving it to "the model should
      infer it's supposed to call this now" is exactly the gap that produces silent, budget-
      burning stalls.</p>
