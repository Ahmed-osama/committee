---
name: document-update
description: Keep docs/index.html — a single self-contained static HTML "living docs" page for the committee codebase — in sync with what the code actually does. Every section pairs a short plain-English explanation with a hand-drawn-style illustration (milaniCreative style: bold black outline, flat pastel fills, white background). Invoked automatically by the Stop hook after every turn, and can be run manually any time docs feel stale.
---

# document-update

Update `docs/index.html`, a single static HTML page that is this project's living
documentation. The user is a visual learner — every concept gets a short paragraph
*and* a small illustration, not text alone.

This runs unattended after every turn (via a Stop hook), so **be fast and
conservative**: touch only what actually changed, don't rewrite sections that are
still accurate, and never take more than a couple minutes.

## Step 1 — figure out what changed

Read `docs/.last-doc-commit` (a single git SHA). If it doesn't exist, this is the
first run — treat the whole repo as "changed." Otherwise run:

```
git diff --stat <that-sha> HEAD
git log --oneline <that-sha>..HEAD
```

If there's no diff (nothing committed since last time — this is normal, most turns
don't warrant a doc change), do nothing and exit. Don't touch the HTML just to touch
it.

If there *is* a diff, read enough of the changed files to understand what actually
changed conceptually (not a line-by-line diff summary — the point is "what would I
tell someone visually about this"). Ignore pure formatting/lint changes.

## Step 2 — decide which sections need work

`docs/index.html` is organized as one section per area of the system (domain model,
planning loop, provider routing, persistence, orchestrator, execution, server/CLI —
see the file itself for the current set). For each area touched by the diff:

- **Concept changed** (new field, different flow, renamed thing) → edit that
  section's text and, if the *shape* of the concept changed, its illustration.
- **Brand new concept** (new file/module with no existing section) → add a new
  section + new illustration, and add it to the sidebar nav.
- **Deleted/removed** → remove the section. Don't leave documentation for code that
  no longer exists.
- Untouched areas → leave completely alone. Do not "improve" prose you weren't
  asked to change.

## Step 3 — the illustration style

Every illustration is inline SVG, sized around `viewBox="0 0 400-480 200-260"`
(adjust as needed, keep roughly 3:2 to 16:9), following this spec — look at the
existing sections in `docs/index.html` for concrete examples before drawing a new
one, they show every technique below in context:

- **Background: always plain white** (`#ffffff` fill, or none). Never colored
  backgrounds behind the drawing itself.
- **Outline**: every shape gets a bold, uniform black stroke — `stroke="#1a1a1a"`,
  `stroke-width="4"` to `"6"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
  Clean, deliberate vector lines — not sketchy/hand-jittered.
- **Fill + pop**: flat colors, no gradients — but every filled shape gets two cheap
  3D/sticker touches copied straight from the milaniCreative reference art:
  1. A **hard offset shadow**: duplicate the shape 3–6px down-right, filled with
     the `-dk` (darker) variant of its color, no stroke, drawn *before* (behind)
     the real shape.
  2. A **gloss highlight**: a small white ellipse or rounded rect at `opacity
     0.3–0.45`, placed near the upper-left of the shape (rotate it -15° to -25°
     for a diagonal streak on round shapes), drawn *after* the shape's stroke.
  Use this palette (each color has a matching `-dk` shadow tone already defined
  as CSS vars in `docs/index.html`'s `:root` — reuse those vars, don't invent new
  hex values):
  - Blue `#5b9bd5` / dark `#3f7cb8` — primary color
  - Cream/skin `#f5e2cf` / dark `#d9bd98`
  - Green `#8fc9a0` / dark `#5fa374`
  - Yellow `#f4d35e` / dark `#d1ab2e`
  - Coral `#f2836b` / dark `#d45f45`
  - Purple `#b8a4d4` / dark `#8f77b3`
  - Ink (outlines/text) `#1a1a1a`
- **Composition**: one clear visual metaphor per illustration, not a literal
  diagram — e.g. a round table with speech-bubble icons for "agents debating," a
  ladder/waterfall of boxes for "provider fallback order," a mailbox for "event
  bus." Simple geometric shapes (circles, rounded rects, simple limbs) over
  detailed rendering.
- **Labels**: bold uppercase, `font-family="'Baloo 2',Arial"` `font-weight="700"`,
  ink color, sized ~12–14px, placed inside or under the drawing.
- Keep each SVG's DOM small (a few dozen elements at most) — these are simple
  icons/metaphors with a bit of sticker-style pop, not fine-detail illustrations.

Section headers in the page body are HTML, not SVG — each is a `<div class="chip">`
(dark pill, white bold `Baloo 2` text, defined in the page's `<style>`). Reuse that
class; don't invent a new header style per section.

## Step 4 — write the file

`docs/index.html` is fully self-contained: inline `<style>`, inline SVGs, a little
vanilla JS for sidebar nav (no build step, no external assets, no CDN dependencies —
it must open correctly as a plain local file). Structure:

- Sticky sidebar with links to each section (anchor `#id` per section).
- Each section: `<h2>` title, 1–3 short paragraphs of plain-English explanation
  (why this piece exists / how it fits together, not a line-by-line code walk), then
  the illustration.
- Keep prose short. This is a map of the system, not a spec.

Use Edit for targeted section changes; only rewrite the whole file on the very
first run.

## Step 5 — record what you documented

After editing, write the current `HEAD` SHA to `docs/.last-doc-commit`
(`git rev-parse HEAD`, no trailing newline needed either way).

Do not commit anything — this only edits the working tree. Committing is the
user's call.
