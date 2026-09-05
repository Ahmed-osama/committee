# packages/core

Shared library consumed as `@committee/core`. Owns everything except the CLI's
command wiring: agent config, provider selection, the planning conversation
loop, an execution-mode tool loop, persistence, and the web viewer server.

## Layout
- `domain/` — plain types: `agent.ts`, `conversation.ts`, `message.ts`, `tool.ts`. No logic, no I/O.
- `conversation/planning-session.ts` — the round-robin multi-agent debate loop (Planner/Architect/Skeptic/…) that turns a goal into a finalized plan. This is the product's core loop; see root CLAUDE.md's "Direction" section for why it's conversational, not a task pipeline.
- `execution/` — a *separate* loop from planning: `execute-command.ts` runs one human-issued command against the real repo with one agent wielding real tools (`tools.ts`: read_file/write_file/run_command, sandboxed under `COMMITTEE_REPO_ROOT`). Only runs after a plan is finalized. Don't merge this into planning-session — it's intentionally distinct (deliberation vs. action).
- `orchestrator/` — glue for the web viewer's live updates, each solving "an HTTP handler isn't otherwise connected to the in-process for-loop running a conversation":
  - `event-bus.ts` — pub/sub so SSE connections can observe messages/thinking as they happen.
  - `injection-queue.ts` — lets a request inject a human message into a running loop.
  - `stop-registry.ts` — lets a request ask a running loop to stop at its next turn boundary.
- `provider/` — multi-provider LLM access:
  - `provider-registry.ts` — the adapter map (anthropic, gemini, groq, deepseek, glm, openrouter, perplexity, ollama) and `isProviderConfigured`.
  - `provider-router.ts` — `PROVIDER_STRENGTH_ORDER` (strongest-first, shared by the whole committee) plus `rotateProviderOrder` so different roles get different primaries while still falling back in strength order.
  - `provider-health.ts` — short in-memory cooldown for a provider/model that just failed, so the next turn steers around it without another round-trip.
  - `generate-for-agent.ts` — the actual call: picks a provider via the router, falls back through the rest of the agent's list on failure, marks failures via provider-health.
  - `rate-limit-tracker.ts` / `rate-limits.ts` / `pricing.ts` — proactive quota/spend tracking and cost computation, independent of the reactive provider-health cooldown.
- `persistence/` — Drizzle (SQLite). `schema.ts` + `repositories/*-repo.ts` (agent, conversation, message). Migrations via `pnpm run db:generate` / `db:migrate` (see root CLAUDE.md).
- `server/` — `web-server.ts` (HTTP + SSE for the live viewer) and `page.ts` (the served HTML/client).

## Conventions seen in this package
- Comments here are reserved for *why*, often naming the specific failure mode a piece of state solves (e.g. "an HTTP request isn't otherwise connected to the loop"). Match that style — don't add comments that restate what the code does.
- Two different "shared mutable store bridging HTTP to an in-process loop" patterns (`injection-queue.ts`, `stop-registry.ts`) are kept as separate small files rather than unified — each is minimal for its one job.
- Provider fallback is layered: `provider-router` picks proactively (health + rate limits known in advance); `generate-for-agent` reacts to an actual failure at call time via `provider-health`. Don't collapse these — they answer different questions (what *should* work vs. what just *didn't*).
