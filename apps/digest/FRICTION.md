# Friction log — apps/digest vs. unmodified packages/core

Real findings from building the second real consumer of `@committee/core`, kept honest:
found by trying to build the thing, not invented to fill out a list. `packages/core` was
not modified to accommodate any of these — that's deliberate (see COM-10/COM-12).

## 1. No public one-shot "call this agent" helper — RESOLVED in COM-12
`generate-for-agent.ts`'s `generateForAgent` is now exported from `@committee/core`'s
index. `apps/digest` uses it directly (`src/index.ts`) instead of re-deriving the
`selectProvider` → `PROVIDER_REGISTRY[...].model(...)` → `generateText` chain by hand —
and gets its retry-across-providers fallback for free, which the hand-rolled version
didn't have. One gotcha worth keeping in mind: `generateForAgent` has no separate `system`
param, so a caller's persona has to be folded into the one `prompt` string (same
convention `planning-session.ts` already uses internally).

## 2. Importing anything from core opens committee's own db file
`persistence/db.ts` opens `packages/core/committee.db` (better-sqlite3, WAL) as an
unconditional module-level side effect, reached through the single barrel `index.ts`. A
consumer using zero persistence functions — `apps/digest` only wanted `selectProvider`/
`PROVIDER_REGISTRY` — still pays this, unless `COMMITTEE_DB_PATH` is set *before* the
import. `apps/digest/src/index.ts` sets it to `:memory:` as a workaround; the underlying
coupling (any import touches a specific file on disk) is still there.

## 3. Provider→model defaults aren't exported — RESOLVED in COM-12
`SHARED_MODEL_BY_PROVIDER` in `agent-repo.ts` is now exported from `@committee/core`'s
index. `apps/digest` imports it directly instead of carrying its own copy — no more
silent-drift risk between the two.

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
**COM-12 outcome:** #1 and #3 extracted as planned — both were genuinely duplicated across
two apps with no divergence in what they needed. #2 stayed unresolved on purpose: it's more
invasive (would mean deferring `db.ts`'s module-level side effect to first actual
persistence call), and per `packages/core/DIVERGENCE.md`, App 2's persistence needs are too
different in shape from App 1's to justify touching that yet. #4 needs a real third data
point before `AgentRole` should grow a generic role. #5 isn't a gap at all.
