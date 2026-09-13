---
title: 'The "sticker" look is just an offset shadow + a gloss ellipse'
date: 2026-09-05
tags: ['frontend']
entryId: '2026-09-05-sticker-shadow-highlight'
---

<p>Redoing the docs illustrations to match a hand-drawn/poster reference style
      came down to two cheap SVG tricks layered on flat shapes, not more detail:</p>

```xml
<!-- 1. hard offset shadow: same shape, shifted, darker, drawn first -->
<rect x="16" y="56" width="120" height="100" rx="16" fill="#3f7cb8"/>
<rect x="10" y="50" width="120" height="100" rx="16" fill="#5b9bd5" stroke="#1a1a1a" stroke-width="5"/>

<!-- 2. gloss highlight: translucent white ellipse, upper-left, drawn last -->
<rect x="18" y="58" width="44" height="18" rx="9" fill="#fff" opacity="0.28" transform="rotate(-18 40 67)"/>
```

<p>No gradients, no filters, no blur — just z-order and a darker/lighter version of
      the same fill color. This is the same idea as Material Design's flat "elevation"
      shadows and the once-trendy "long shadow" flat-design style: depth read from hard
      color contrast, not soft blur. It's also cheap enough that an LLM can be told the
      rule (offset-shadow-behind, gloss-highlight-on-top, reuse a small fixed palette) and
      generate new icons in a consistent style without seeing every prior example — that's
      exactly what the plan-visualizer agent does now for finalized plans.</p>
      <div class="reading">
        <span class="label">Further reading</span>
        <ul>
          <li><em>Refactoring UI</em> by Adam Wathan &amp; Steve Schoger — the shadows/depth
          chapter is the clearest short treatment of "flat but with just enough depth" for
          people who don't think of themselves as designers.</li>
        </ul>
      </div>
