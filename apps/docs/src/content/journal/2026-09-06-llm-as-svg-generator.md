---
title: 'Getting a diagram out of an LLM without a rendering library'
date: 2026-09-06
tags: ['ai', 'frontend']
entryId: '2026-09-06-llm-as-svg-generator'
---

<p><code>generate-plan-visual.ts</code> asks the model to respond with "exactly one
      <code>&lt;svg&gt;...&lt;/svg&gt;</code> element and nothing else," then pulls it out
      with a plain regex (<code>/&lt;svg&gt;[\s\S]*?&lt;\/svg&gt;/i</code>) and drops it
      straight into the page. No diagramming library, no layout engine, no JSON-then-render
      step — SVG is just text, and a model that's seen enough of it can write the markup
      directly, coordinates and all.</p>
      <p>The trick that makes this reliable enough to ship is narrowing the request until the
      output is nearly deterministic: a fixed viewBox range, a closed palette of six hex
      colors, an exact shadow-offset/gloss recipe, and "if there are 3 tasks, draw 3 steps,
      not more." Loose instructions ("draw a nice diagram") invite an under-specified,
      inconsistent result; a tight visual spec turns free-text generation into something you
      can safely regex out and trust to render. The regex match is also the fallback path —
      if the model wraps the SVG in prose or markdown fences anyway, extraction still works
      because it only looks for the tag pair, not an exact-full-string match.</p>
      <p>This is also why the visualizer is deliberately outside the round-robin planning
      loop (see <code>packages/core/CLAUDE.md</code>): it's a one-shot job handed a
      finalized, immutable input, so there's nothing to debate and no state to carry between
      turns — just one prompt in, one SVG out.</p>
