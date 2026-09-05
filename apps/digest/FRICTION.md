# Friction log — apps/digest vs. unmodified packages/core

Real findings from building the second real consumer of `@committee/core`, kept honest:
found by trying to build the thing, not invented to fill out a list. `packages/core` was
not modified to accommodate any of these — that's deliberate (see COM-10/COM-12).

## 1. No public one-shot "call this agent" helper
`generate-for-agent.ts` (core's internal single-call-with-fallback function) isn't
exported from `@committee/core`'s index, and `packages/core/package.json`'s `exports` map
(`"." : "./src/index.ts"` only) hard-blocks any subpath import —
`ERR_PACKAGE_PATH_NOT_EXPORTED`, not just an unenforced convention. `apps/digest` had to
manually re-derive the same chain `apps/cli`'s `ping` command already does by hand:
`selectProvider(agent)` → `PROVIDER_REGISTRY[providerId].model(modelId)` → `generateText`
from `'ai'` itself. Two apps now duplicate this chain.

## 2. Importing anything from core opens committee's own db file
`persistence/db.ts` opens `packages/core/committee.db` (better-sqlite3, WAL) as an
unconditional module-level side effect, reached through the single barrel `index.ts`. A
consumer using zero persistence functions — `apps/digest` only wanted `selectProvider`/
`PROVIDER_REGISTRY` — still pays this, unless `COMMITTEE_DB_PATH` is set *before* the
import. `apps/digest/src/index.ts` sets it to `:memory:` as a workaround; the underlying
coupling (any import touches a specific file on disk) is still there.

## 3. Provider→model defaults aren't exported
`SHARED_MODEL_BY_PROVIDER` in `agent-repo.ts` is a private constant. `apps/digest` had to
redeclare its own copy (`MODEL_BY_PROVIDER` in `src/index.ts`) to get sane default models
per provider — it can silently drift from committee's own copy with no compiler warning.

## 4. `AgentRole` has no generic "single-purpose worker" role
The union (`planner | architect | skeptic | devils_advocate | estimator | reviewer |
visualizer`) is entirely planning-conversation-shaped. `apps/digest`'s agent isn't any of
those things — it reused `'reviewer'` as the least-wrong label just to satisfy
`AgentConfig`'s type.

## 5. Persistence pattern didn't transfer — and that's fine
Core's schema (`agents`/`conversations`/`messages`/`providerCalls` via Drizzle) is entirely
planning-conversation-shaped. `apps/digest`'s actual need (a flat history of past digests)
was simple enough that plain JSON via `node:fs` was faster and clearer than standing up a
second Drizzle schema. Not every app needs core's persistence machinery — this is a
divergence to note for COM-11, not a gap to fill.

---
**For COM-12:** #1 and #3 are the two that look like real, low-risk extraction candidates
(export `generateForAgent` and `SHARED_MODEL_BY_PROVIDER`, plus loosen or note the reason
for the `exports` map's subpath block) — both apps already independently reimplement the
same logic today. #2 is more invasive (would mean deferring `db.ts`'s side effect, e.g.
lazy-opening on first actual persistence call) and #4 needs a real third data point before
deciding whether `AgentRole` should grow a generic role. #5 isn't a gap at all.
