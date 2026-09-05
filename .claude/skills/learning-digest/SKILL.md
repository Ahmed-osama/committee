---
name: learning-digest
description: Append a dated journal entry to docs/learning.html — a running log of frontend/JavaScript/AI tips, concept explanations, and reading recommendations drawn from what actually happened in this repo. Invoked automatically by the Stop hook after every turn, alongside document-update.
---

# learning-digest

Keep `docs/learning.html` — a personal learning journal, newest entry first — updated
with what this session's work actually teaches, aimed at frontend/JavaScript/AI
topics. This is a companion to `docs/index.html` (the architecture reference) but a
different shape entirely: dated entries that accumulate, not a reorganized reference.

Runs unattended after every turn (via the same Stop hook as `document-update`), so
**be fast and conservative** — most turns produce nothing worth journaling. Only
write an entry when there's a real teaching moment.

## Step 1 — figure out what changed

Read `docs/.last-learning-commit` (a git SHA). If missing, this is the first run —
look at the whole repo's recent history. Otherwise:

```
git log --oneline <that-sha>..HEAD
git diff --stat <that-sha> HEAD
```

If there's no diff, do nothing and exit — most turns don't warrant a journal entry,
and an empty/filler entry is worse than no entry.

## Step 2 — decide if there's a real entry here

Not every change is a lesson. Skip silently if the diff is pure formatting, a typo
fix, or something with no teachable angle. Write an entry only when the diff
illustrates something genuinely worth explaining about **frontend, JavaScript, or
AI/LLM engineering** — e.g.:

- A pattern used in the code that's a broader technique worth knowing (e.g. why a
  round-robin turn loop avoids a single-agent tool-loop's failure modes; SSE vs.
  polling; SQLite via an ORM's migration model; ESM/tsx quirks; rate-limit
  backoff/fallback design).
- A mistake that got caught and fixed, and *why* the fix works.
- A concept the user asked about or that came up implicitly in the work.

One entry can cover multiple small related turns since the last run — don't spam
one entry per commit.

## Step 3 — write the entry

Prepend (most recent first) a new `<article class="entry">` inside `#journal` in
`docs/learning.html`, following this exact structure (copy an existing entry as the
template — don't improvise a different shape):

```html
<article class="entry" data-entry-id="YYYY-MM-DD-slugified-title">
  <time datetime="YYYY-MM-DD">Month D, YYYY</time>
  <h2>Concept-naming title</h2>
  <p>...</p>
  <div class="reading">
    <span class="label">Further reading</span>
    <ul><li>...</li></ul>
  </div>
  <div class="entry-footer">
    <div class="tags"><span class="chip-tag ai">AI/LLM</span></div>
    <button class="read-toggle" type="button">Mark as read</button>
  </div>
</article>
```

- `data-entry-id` is required and must be unique — `YYYY-MM-DD-` plus a short
  lowercase-hyphenated slug of the title. The page's mark-as-read tracking
  (client-side, `localStorage`) keys off this attribute, so a duplicate or missing
  id breaks read-state for that entry.
- The `<h2>` names the actual lesson, not "Session update" (e.g. "Why round-robin
  beats a single agent's tool loop").
- 1–3 short paragraphs teaching the concept plainly — assume the reader (the repo's
  own user) is a competent engineer learning this specific angle, not a beginner.
  Ground it in what actually happened in the repo (reference the real file/function)
  before generalizing to the broader lesson.
- Optionally, one small code snippet (`<pre><code>`) if it clarifies more than prose.
- The `.reading` block (1–2 items): real, specific, named resources (a book, a
  course, a well-known blog post/talk) you're actually confident exist — no live web
  access here, so if you're not sure of the exact title/author, either omit the
  whole `.reading` div for this entry or hedge honestly ("something like X's writing
  on Y") rather than inventing a precise-sounding but possibly-wrong citation. A
  missing reading link beats a fabricated one.
- `.entry-footer` always pairs the tag chips with the `.read-toggle` button — reuse
  the `.chip-tag` classes already in the page (`js`, `frontend`, `ai`, `node`,
  `testing`, `architecture`), at most 3, whichever genuinely apply. The button's
  markup is always exactly `<button class="read-toggle" type="button">Mark as
  read</button>` — its label text is rewritten client-side by the page's own script
  based on read state, so don't hardcode "✓ Read" here even for a re-read entry.

Never touch the `<script>` block at the end of the file, or the `#liveIndicator`
markup in the header — that's what makes read-tracking and live updates (an
already-open tab picking up new entries with no manual refresh, when served via
`pnpm run cli serve`) work. Only ever add/remove `<article>` children of `#journal`.

Keep the page's existing visual language: same fonts (`Baloo 2` / `Nunito`), same
`.chip` dark-pill treatment for the page title, white background, the palette
already defined in `docs/index.html` — reuse it for consistency across both docs
pages rather than inventing a new look here.

## Step 4 — keep it bounded

If `#journal` has more than ~25 entries after adding this one, delete the oldest
entries down to ~20. This is a rolling journal, not an ever-growing archive.

## Step 5 — record what you covered

Write the current `HEAD` SHA to `docs/.last-learning-commit`.

Do not commit anything — this only edits the working tree.
