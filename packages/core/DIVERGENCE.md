# Divergent requirements: committee (App 1) vs. digest (App 2)

Written before COM-12 (extracting anything into `packages/core`), per the launchpad
initiative's gate: don't extract until a second real consumer shows what's actually
shared vs. what only looks shared from one data point. See `apps/digest/FRICTION.md` for
the concrete gaps this draws on.

## Session memory

**committee (App 1):** a full relational session — `agents`/`conversations`/`messages`/
`providerCalls` tables via Drizzle (`packages/core/src/persistence/schema.ts`). Needs this
shape because the round-robin debate loop has real state to track: which agent spoke on
which turn, message intent (`propose`/`challenge`/`agree`), conversation status
(`open`/`finalized`/`failed`), and per-agent rate-limit/spend ceilings enforced across
calls. Retrievable later via the web viewer (SSE from `EventBus`).

**digest (App 2):** no session at all, by nature — one topic in, one call, one output.
Its history (`apps/digest/src/history.ts`) is a flat JSON array append-log: `{ topic,
digest, at }`. No relations, no status, no per-turn anything.

**Divergence:** App 1's need is inherently relational (a conversation *is* a sequence of
turns with state transitions); App 2's need is "remember what happened," full stop — a
flat log already satisfies it completely. A shared `SessionStore` abstraction would either
have to be trivial enough (get/append a blob by id) that App 2 gains nothing over what it
already wrote in ~15 lines, or rich enough to match App 1's schema, which App 2 doesn't
need and shouldn't be made to carry.

## Model/provider routing

**committee (App 1):** six roles, each seeded with a *different* provider preference order
via `rotateProviderOrder(0..5)` (`agent-repo.ts`) — deliberate diversity so Planner/
Architect/Skeptic/etc. aren't all hitting the same provider in the same debate. The
diversity itself is load-bearing: it's part of why the committee's debate has genuinely
different "voices."

**digest (App 2):** one role, `rotateProviderOrder(0)` — same starting offset as
committee's Planner. There is no second role to differentiate from, so "diversity across
roles" isn't a concept App 2 has any use for; its only requirement is "some configured
provider answers."

**Divergence:** App 1's routing design assumes a *pool* of co-existing roles that benefit
from being spread across providers. App 2 has exactly one role and no such need. An
`LLMClient`-style abstraction extracted from App 1 alone would likely bake in the
multi-role-diversity assumption where App 2 needs none of it — that's exactly the kind of
premature generalization this initiative is trying to avoid (see root `CLAUDE.md`'s
"Direction" section on the previously-abandoned pipeline).

## What this means for COM-12

Both divergences point the same way: the two apps' actual session/routing *shapes* are too
different for a shared abstraction beyond the narrow, already-duplicated pieces
`FRICTION.md` flagged as safe (`generateForAgent`, `SHARED_MODEL_BY_PROVIDER` — both apps
independently re-derive the exact same low-level call chain today, which is the concrete,
low-risk signal to extract). A `SessionStore` or `LLMClient`-level abstraction stays
premature until a third consumer's needs land somewhere between these two extremes.
