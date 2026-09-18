# apps/docs

Statically generated curriculum site (Astro, `output: 'static'`) replacing the old
hand-rolled `docs/index.html` / `docs/learning.html`. `pnpm run docs:dev` /
`pnpm run docs:build` from the repo root.

## Layout

- `src/content/architecture/<section>/NN-topic.md` — one markdown file per topic, grouped
  into a folder per repo area (`overview`, `core` → `packages/core`, `db` → `packages/db`,
  `apps` → `apps/*`, `groundtruth` → the GroundTruth product). `order` in frontmatter sets
  the topic's position within its section — that ordering is the curriculum: the sidebar
  and each topic page's prev/next nav walk sections and topics in that sequence, section
  by section per `sectionOrder` in `BaseLayout.astro`.
- `src/content/journal/YYYY-MM-DD-slug.md` — one file per learning-journal entry (dated,
  newest-first on `/journal`), frontmatter `title`/`date`/`tags`/`entryId`. `entryId` backs
  the client-side "mark as read" state (`localStorage`), so it must stay unique and stable.
- `src/content/config.ts` — the two collections' schemas (`architecture`, `journal`).
- `src/layouts/BaseLayout.astro` — shared shell: fonts, the milaniCreative color palette
  (CSS vars also referenced by inline SVGs inside topic markdown via `var(--blue)` etc.),
  and the sidebar built from `getCollection('architecture')`.
- `src/pages/architecture/[...slug].astro` — renders one topic + prev/next curriculum nav.
- `src/pages/journal/index.astro` — the journal list + its own read-tracking script.

## Conventions

- Illustrations are inline `<svg>` embedded directly as raw HTML inside a topic's markdown
  body (Astro's markdown renderer passes raw HTML through) — same milaniCreative sticker
  style (bold black outline, flat fills, hard offset shadow, gloss highlight) as before.
  See `.claude/skills/document-update/SKILL.md` for the actual drawing spec.
- `document-update` and `learning-digest` (both `.claude/skills/`) write directly into
  `src/content/architecture/` and `src/content/journal/` respectively — this is generated-
  but-committed content, not a build artifact; only `dist/` is build output.
