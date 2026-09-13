---
name: document-update
description: Keep apps/docs/src/content/architecture — a statically generated (Astro) curriculum site for the committee codebase — in sync with what the code actually does. Content is markdown, one topic per file, grouped into a folder per repo section, ordered as a curriculum via frontmatter. Every topic pairs a short plain-English explanation with a hand-drawn-style illustration (milaniCreative style: bold black outline, flat pastel fills, white background). Invoked automatically by the Stop hook after every turn, and can be run manually any time docs feel stale.
---

# document-update

Update `apps/docs/src/content/architecture/`, the markdown source for this project's
living documentation site (`apps/docs`, an Astro app — `pnpm run docs:dev` to view it).
The user is a visual learner — every topic gets a short paragraph _and_ a small
illustration, not text alone.

This runs unattended after every turn (via a Stop hook), so **be fast and
conservative**: touch only what actually changed, don't rewrite topics that are
still accurate, and never take more than a couple minutes.

## Step 1 — figure out what changed

Read `apps/docs/.last-doc-commit` (a single git SHA). If it doesn't exist, this is the
first run — treat the whole repo as "changed." Otherwise run:

```
git diff --stat <that-sha> HEAD
git log --oneline <that-sha>..HEAD
```

If there's no diff (nothing committed since last time — this is normal, most turns
don't warrant a doc change), do nothing and exit. Don't touch content just to touch it.

If there _is_ a diff, read enough of the changed files to understand what actually
changed conceptually (not a line-by-line diff summary — the point is "what would I
tell someone visually about this"). Ignore pure formatting/lint changes.

## Step 2 — decide which topics need work

Content is organized one folder per repo section, each a step in the curriculum:
`overview/` (repo-wide direction), `core/` (`packages/core`), `db/` (`packages/db`),
`apps/` (`apps/*` front doors and platform), `groundtruth/` (the GroundTruth product) —
run `find apps/docs/src/content/architecture -name '*.md'` to see the current set. Each
file is `NN-slug.md` with frontmatter `title` + `order`; `order` is that topic's position
within its section's curriculum, read by `apps/docs/src/layouts/BaseLayout.astro` for the
sidebar and by `apps/docs/src/pages/architecture/[...slug].astro` for prev/next nav.

For each area touched by the diff:

- **Concept changed** (new field, different flow, renamed thing) → edit that topic
  file's prose and, if the _shape_ of the concept changed, its illustration.
- **Brand new concept within an existing section** → add a new `NN-slug.md` file in that
  section's folder with the next `order` number.
- **Brand new repo section** (a genuinely new area, not a new package under an
  existing app) → create a new folder, and add it to `sectionOrder`/`sectionLabels`/
  `swatchBySection` in `apps/docs/src/layouts/BaseLayout.astro`.
- **Deleted/removed** → delete that topic's `.md` file. Don't leave documentation for
  code that no longer exists. If deleting leaves a section empty, also drop it from
  `BaseLayout.astro`'s `sectionOrder`.
- Untouched areas → leave completely alone. Do not "improve" prose you weren't asked
  to change.

## Step 3 — the illustration style

Every illustration is inline SVG, embedded as raw HTML directly inside the topic's
markdown body (Astro's markdown renderer passes raw HTML through untouched — no special
syntax needed), sized around `viewBox="0 0 400-480 200-260"` (adjust as needed, keep
roughly 3:2 to 16:9), following this spec — look at existing topic files for concrete
examples before drawing a new one, they show every technique below in context:

- **Background: always plain white** (`#ffffff` fill, or none). Never colored
  backgrounds behind the drawing itself.
- **Outline**: every shape gets a bold, uniform black stroke — `stroke="#1a1a1a"`,
  `stroke-width="4"` to `"6"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
  Clean, deliberate vector lines — not sketchy/hand-jittered.
- **Fill + pop**: flat colors, no gradients — but every filled shape gets two cheap
  3D/sticker touches copied straight from the milaniCreative reference art:
  1. A **hard offset shadow**: duplicate the shape 3–6px down-right, filled with
     the `-dk` (darker) variant of its color, no stroke, drawn _before_ (behind)
     the real shape.
  2. A **gloss highlight**: a small white ellipse or rounded rect at `opacity
0.3–0.45`, placed near the upper-left of the shape (rotate it -15° to -25°
     for a diagonal streak on round shapes), drawn _after_ the shape's stroke.
     Use this palette (each color has a matching `-dk` shadow tone already defined
     as CSS vars in `apps/docs/src/layouts/BaseLayout.astro`'s global `:root` — reuse
     those vars, don't invent new hex values):
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

Wrap the SVG in `<div class="art">...</div>` — that class (dark card, drop shadow,
rounded corners) is defined globally in `BaseLayout.astro`; reuse it rather than
inventing new wrapper markup per topic.

**No blank lines inside the raw-HTML portion of a topic (the `<p>` prose through the
closing `</div>` of `.art`).** All of that is one continuous markdown "HTML block";
a blank line ends it, and whatever HTML follows the blank line gets misparsed as an
indented/plaintext code block instead of rendered markup — this has silently broken
an SVG illustration before. If a real markdown fenced code block (see Step 4.5)
needs to sit between two HTML paragraphs, that's fine — fences are exempt — but keep
every other line of prose/SVG contiguous with no blank line in between.

## Step 4 — write the file

Each topic file is plain markdown with frontmatter:

```markdown
---
title: 'Short topic title'
order: 3
---

1–3 short paragraphs of plain-English explanation (why this piece exists / how it
fits together, not a line-by-line code walk). Inline `code` and **bold**/_italic_
work as normal markdown; the illustration goes last.

<div class="art">
<svg viewBox="0 0 460 240" width="460" height="240">
  ...
</svg>
</div>
```

Keep prose short. This is a map of the system, not a spec. Use Edit for targeted
changes to an existing topic file; only write a whole new file for a brand-new topic.

## Step 4.5 — a real code snippet, when one earns its place

If a topic benefits from showing actual code (not the illustration's metaphor, but a
real signature/snippet), use a genuine fenced code block with a language tag —
these get real syntax highlighting (Shiki, configured in `astro.config.mjs`) plus a
copy button and language label, added client-side by the architecture page itself.
Placed between two raw-HTML paragraphs, it looks like this in the source file:

- `<p>...</p>` (prose ending right before the snippet)
- a blank line
- a fenced block opened with three backticks + a language tag (e.g. `ts`), the code
  itself indented normally, then a closing three-backtick line
- a blank line
- `<p>...</p>` (prose picking back up)

For example:

```ts
export function example(x: number): number {
  return x + 1;
}
```

Only add one when it clarifies more than prose would (a real exported function
signature, a short config shape) — most topics don't need one, and this is a map of
the system, not a code walkthrough. Keep the blank line immediately before and after
the fence (required for it to parse as a fence at all); do not add blank lines
anywhere else per the rule above.

## Step 5 — record what you documented

After editing, write the current `HEAD` SHA to `apps/docs/.last-doc-commit`
(`git rev-parse HEAD`, no trailing newline needed either way).

Do not commit anything — this only edits the working tree. Committing is the
user's call.
