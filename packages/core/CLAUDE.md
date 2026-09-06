# packages/core

Shared library consumed as `@committee/core`. Owns everything except the CLI's
command wiring: agent config, provider selection, the planning conversation
loop, an execution-mode tool loop, persistence, and the web viewer server.

## Layout
- `domain/` — plain types: `agent.ts`, `conversation.ts`, `message.ts`, `tool.ts`. No logic, no I/O. `Message.content` is plain text only — no image/multimodal field anywhere in this type or in any provider adapter's call shape. So even though several configured providers (anthropic, gemini) are vision-capable models, committee cannot actually show them a screenshot today; a UI/UX-review role can only critique text/code descriptions, not images. Adding real screenshot review would mean threading an image attachment through `Message` and `generate-for-agent.ts` into the model call — a feature gap, not a config change.
- `conversation/planning-session.ts` — the round-robin multi-agent debate loop (Planner/Architect/Skeptic/…) that turns a goal into a finalized plan. This is the product's core loop; see root CLAUDE.md's "Direction" section for why it's conversational, not a task pipeline. Past `CLOSING_PHASE_FRACTION` (75%) of `maxTurns` the skeptic is pushed to agree absent a critical objection; if the loop still exhausts `maxTurns` with no plan, one forced extra call makes the finalizer commit to a best-effort plan from the transcript rather than returning nothing. `initialTranscript`/`startTurn` let a session resume after a prior one already finalized — used by the web server's "reopen & regenerate" flow to reopen a finalized conversation with new human feedback; `hasSkepticAgreed`/`countSkepticChallenges` are deliberately scoped to only the *current* round's messages (`turn >= startTurn`) so a stale `agree` from before the regenerate can't let the finalizer skip straight back to closing.
- `conversation/generate-conversation-title.ts` — one-shot, out-of-band call (same shape as `generate-plan-visual.ts`) that turns a goal into a short sidebar label; fired fire-and-forget right after `createConversation`.
- `execution/` — a *separate* loop from planning: `execute-command.ts` runs one human-issued command against the real repo with one agent wielding real tools (`tools.ts`: read_file/write_file/run_command, sandboxed under `COMMITTEE_REPO_ROOT`). Only runs after a plan is finalized. Don't merge this into planning-session — it's intentionally distinct (deliberation vs. action).
- `orchestrator/` — glue for the web viewer's live updates, each solving "an HTTP handler isn't otherwise connected to the in-process for-loop running a conversation":
  - `event-bus.ts` — pub/sub so SSE connections can observe messages/thinking/paused-state as they happen.
  - `injection-queue.ts` — lets a request inject a human message into a running loop.
  - `stop-registry.ts` — lets a request ask a running loop to stop at its next turn boundary.
  - `pause-registry.ts` — same shape as `stop-registry.ts`, but the loop *blocks* (polls every 500ms)
    instead of ending — backs the web viewer's "wait for me" human intervention. Sending a message
    while paused auto-clears it (`handleInject`); no separate resume click required for that path.
- `provider/` — multi-provider LLM access:
  - `provider-registry.ts` — the adapter map (anthropic, gemini, groq, sambanova, deepseek, glm, nvidia-nim, openrouter, perplexity, ollama) and `isProviderConfigured`. `sambanova`/`nvidia-nim` were added by the scheduled provider-scout routine's findings (2026-09-06). `sambanova` is live-tested but currently unusable — every call hits `PAYMENT_METHOD_REQUIRED` on this account (see `sambanova-adapter.ts`) despite third-party writeups claiming a no-card free tier. `nvidia-nim` has a key configured but hasn't been live-tested yet.
  - `provider-router.ts` — `PROVIDER_STRENGTH_ORDER` (strongest-first, shared by the whole committee) plus `rotateProviderOrder` so different roles get different primaries while still falling back in strength order.
  - `provider-health.ts` — short in-memory cooldown for a provider/model that just failed, so the next turn steers around it without another round-trip.
  - `generate-for-agent.ts` — the actual call: picks a provider via the router, falls back through the rest of the agent's list on failure, marks failures via provider-health.
  - `rate-limit-tracker.ts` / `rate-limits.ts` / `pricing.ts` — proactive quota/spend tracking and cost computation, independent of the reactive provider-health cooldown.
- `persistence/` — Drizzle (SQLite). `schema.ts` + `repositories/*-repo.ts` (agent, conversation, message). Migrations via `pnpm run db:generate` / `db:migrate` (see root CLAUDE.md). `agent-repo.ts` exports both the seven `getOrCreateDefault*()` role wrappers and a generic `getOrCreateAgent(config)` for callers building custom-titled seats (same behavioral role, caller-chosen name/systemPrompt) — see the MCP server's `committee_plan` roster support.
- `server/` — `web-server.ts` (HTTP + SSE for the live viewer) and `page.ts` (the served HTML/client, one big
  template string, no separate frontend app/build). `page.ts` does its own client-side routing (`history.pushState`
  to `/c/:id`, a `popstate` listener) — `web-server.ts` serves the same `PAGE_HTML` shell for both `/` and any
  `/c/:id` so a deep link/refresh works. Once a conversation is finalized, the composer offers two explicit,
  user-picked modes on the same textarea (`data-mode` on the submit button): `execute` (unchanged — runs
  `execute-command.ts` against the real repo) and `regenerate` (`POST /regenerate` — reopens the debate via
  `runPlanningSession`'s `initialTranscript`/`startTurn`, discarding the old plan card client-side). Deliberately
  two modes rather than one, since execute-mode and planning are already documented above as intentionally
  distinct loops.

## Conventions seen in this package
- Comments here are reserved for *why*, often naming the specific failure mode a piece of state solves (e.g. "an HTTP request isn't otherwise connected to the loop"). Match that style — don't add comments that restate what the code does.
- Two different "shared mutable store bridging HTTP to an in-process loop" patterns (`injection-queue.ts`, `stop-registry.ts`) are kept as separate small files rather than unified — each is minimal for its one job.
- Provider fallback is layered: `provider-router` picks proactively (health + rate limits known in advance); `generate-for-agent` reacts to an actual failure at call time via `provider-health`. Don't collapse these — they answer different questions (what *should* work vs. what just *didn't*).
