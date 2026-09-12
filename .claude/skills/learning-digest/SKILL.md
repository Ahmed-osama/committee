---
name: learning-digest
description: Append a dated journal entry as a markdown file under apps/docs/src/content/journal — a running log of frontend/JavaScript/AI tips, concept explanations, and reading recommendations drawn from what actually happened in this repo, rendered newest-first at /journal by the docs site (apps/docs). Invoked automatically by the Stop hook after every turn, alongside document-update.
---

# learning-digest

Keep `apps/docs/src/content/journal/` — a personal learning journal, rendered
newest-first at `/journal` by the docs site (`apps/docs`, Astro — `pnpm run docs:dev`
to view it) — updated with what this session's work actually teaches, aimed at
frontend/JavaScript/AI topics. This is a companion to the architecture curriculum
(`apps/docs/src/content/architecture/`, kept by `document-update`) but a different
shape entirely: dated entries that accumulate, not a reorganized reference.

Runs unattended after every turn (via the same Stop hook as `document-update`), so
**be fast and conservative** — most turns produce nothing worth journaling. Only
write an entry when there's a real teaching moment.

## Step 1 — figure out what changed

Read `apps/docs/.last-learning-commit` (a git SHA). If missing, this is the first run —
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
- A mistake that got caught and fixed, and _why_ the fix works.
- A concept the user asked about or that came up implicitly in the work.

One entry can cover multiple small related turns since the last run — don't spam
one entry per commit.

## Step 3 — write the entry

Create a new file `apps/docs/src/content/journal/YYYY-MM-DD-slugified-title.md`
(copy an existing entry's shape — don't improvise a different one), frontmatter +
markdown body:

```markdown
---
title: 'Concept-naming title'
date: YYYY-MM-DD
tags: ['ai']
entryId: 'YYYY-MM-DD-slugified-title'
---

1–3 short paragraphs teaching the concept plainly.

<div class="reading">
<span class="label">Further reading</span>
<ul><li>...</li></ul>
</div>
```

- The filename and `entryId` must match, and `entryId` must be unique — the journal
  page's mark-as-read tracking (client-side, `localStorage`) keys off it, so a
  duplicate or changed id breaks read-state for that entry.
- `title` names the actual lesson, not "Session update" (e.g. "Why round-robin
  beats a single agent's tool loop").
- Body: 1–3 short paragraphs teaching the concept plainly — assume the reader (the
  repo's own user) is a competent engineer learning this specific angle, not a
  beginner. Ground it in what actually happened in the repo (reference the real
  file/function) before generalizing to the broader lesson.
- Optionally, one small **fenced code block** (` ```ts ` / ` ```xml ` / etc., not raw
  `<pre><code>`) if it clarifies more than prose — a real fence gets syntax
  highlighting plus a copy button automatically (Shiki + client-side enrichment
  shared with the architecture pages, see `apps/docs/src/scripts/enrich-code-blocks.ts`);
  raw `<pre>` HTML does not. Keep a blank line immediately before and after the fence
  (required for it to parse as a fence at all).
- `tags` is 1–3 of exactly: `js`, `frontend`, `ai`, `node`, `testing`, `architecture`
  (the collection schema in `apps/docs/src/content/config.ts` only accepts these) —
  pick whichever genuinely apply.
- The `<div class="reading">` block (1–2 items) is optional: real, specific, named
  resources (a book, a course, a well-known blog post/talk) you're actually
  confident exist — no live web access here, so if you're not sure of the exact
  title/author, either omit the whole block for this entry or hedge honestly
  ("something like X's writing on Y") rather than inventing a precise-sounding but
  possibly-wrong citation. A missing reading link beats a fabricated one.

Never touch `apps/docs/src/pages/journal/index.astro` or `src/content/config.ts` for
a routine entry — those are the page template and schema, not content.

If you use raw HTML (the `<div class="reading">` block, or `<p>` instead of a plain
markdown paragraph), keep it blank-line-free internally — a blank line ends a raw
HTML block in markdown, and whatever HTML follows the blank line gets misparsed as a
plaintext code block. This doesn't apply to genuine markdown fences (those are exempt,
and need their surrounding blank lines) or to plain markdown paragraphs (prefer plain
markdown prose over raw `<p>` tags for the entry body — it doesn't have this hazard).

## Step 4 — keep it bounded

If `apps/docs/src/content/journal/` has more than ~25 entries after adding this one,
delete the oldest files down to ~20. This is a rolling journal, not an ever-growing
archive.

## Step 5 — record what you covered

Write the current `HEAD` SHA to `apps/docs/.last-learning-commit`.

Do not commit anything — this only edits the working tree.
