import { eq } from 'drizzle-orm';
import type { AgentConfig } from '../../domain/agent.js';
import { rotateProviderOrder } from '../../provider/provider-router.js';
import { db } from '../db.js';
import { agents } from '../schema.js';

// Every model id here was verified live against the provider's own API
// before being added — cached "current" model names turned out stale for
// both Gemini and Groq within one session, so nothing is hardcoded blind.
// glm-4-flash specifically is Zhipu's genuinely free-tier model (see
// pricing.ts) — glm-4.5 is the paid tier, deliberately not used here.
export const SHARED_MODEL_BY_PROVIDER = {
  groq: 'qwen/qwen3.8-27b',
  gemini: 'gemini-3.6-flash',
  ollama: 'llama3.1:8b',
  anthropic: 'claude-sonnet-5',
  deepseek: 'deepseek-v4-flash',
  glm: 'glm-4-flash',
  // `:free` suffix pins OpenRouter's free-tier routing for this model —
  // live-tested 2026-08-31 (see openrouter-adapter.ts).
  openrouter: 'minimax/minimax-m3:free',
  // Search-augmented, not free — see pricing.ts and perplexity-adapter.ts.
  perplexity: 'sonar',
  // SambaNova's own docs call this their most battle-tested free-tier
  // model — see sambanova-adapter.ts. Not yet live-tested (no key held).
  sambanova: 'Meta-Llama-3.3-70B-Instruct',
  // One of 100+ models NVIDIA NIM serves for free — see nvidia-nim-adapter.ts.
  // Not yet live-tested (no key held).
  'nvidia-nim': 'meta/llama-3.1-70b-instruct',
};

const DEFAULT_PLANNER: AgentConfig = {
  id: 'default-planner',
  name: 'Planner',
  role: 'planner',
  systemPrompt:
    'You are the planner in a small planning conversation. Given a goal, you propose a concrete breakdown into ' +
    'tasks — the "how" and the sequencing. You listen to the architect and the skeptic and revise your proposal ' +
    "in response to real objections, rather than repeating yourself. You don't pad your turns — say only what " +
    'moves the plan forward.',
  providerPreference: rotateProviderOrder(0),
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  toolAllowList: [],
};

const DEFAULT_ARCHITECT: AgentConfig = {
  id: 'default-architect',
  name: 'Architect',
  role: 'architect',
  systemPrompt:
    'You are the architect in a small planning conversation. You focus on structure: does the breakdown make ' +
    'sense as discrete, independently completable tasks? Are there missing dependencies or ordering problems? ' +
    'You propose concrete restructuring, not vague concerns. Once the plan is genuinely sound, you say so plainly ' +
    'and finalize it.',
  providerPreference: rotateProviderOrder(1),
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  // Only the architect finalizes — the tool list for Linear's MCP tools is
  // merged in at conversation-start time, once they're fetched live.
  toolAllowList: ['finalize_plan'],
};

const DEFAULT_SKEPTIC: AgentConfig = {
  id: 'default-skeptic',
  name: 'Skeptic',
  role: 'skeptic',
  systemPrompt:
    'You are the skeptic in a small planning conversation. Your job is to find real problems with the current ' +
    'proposal — scope creep, unstated assumptions, tasks that are actually two tasks, anything that would bite ' +
    'someone during execution. You are not contrarian for its own sake: if a revised proposal actually addresses ' +
    'your prior objection, say so and move on instead of repeating it.',
  providerPreference: rotateProviderOrder(2),
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  toolAllowList: [],
};

const DEFAULT_DEVILS_ADVOCATE: AgentConfig = {
  id: 'default-devils-advocate',
  name: "Devil's Advocate",
  role: 'devils_advocate',
  systemPrompt:
    "You are the devil's advocate in a small planning conversation. Your job is to argue for a genuinely different " +
    'approach than the one on the table — not just point out flaws (the skeptic already does that), but make the ' +
    'case for an alternative shape of the solution. If you think the current approach is actually right, say so ' +
    'plainly instead of manufacturing a fake alternative.',
  providerPreference: rotateProviderOrder(3),
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  toolAllowList: [],
};

const DEFAULT_ESTIMATOR: AgentConfig = {
  id: 'default-estimator',
  name: 'Estimator',
  role: 'estimator',
  systemPrompt:
    'You are the estimator in a small planning conversation. Your job is to flag effort, risk, and resourcing ' +
    'concerns on the tasks currently proposed — which ones are bigger than they look, which depend on something ' +
    'outside the team\'s control, which should be split or merged for that reason. Be concrete about which task ' +
    'you mean, not general commentary on scope.',
  providerPreference: rotateProviderOrder(4),
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  toolAllowList: [],
};

const DEFAULT_REVIEWER: AgentConfig = {
  id: 'default-reviewer',
  name: 'Reviewer',
  role: 'reviewer',
  systemPrompt:
    'You are the reviewer in a small planning conversation. Once the architect and skeptic are converging, you do ' +
    'a final clarity and completeness pass: is every task actually understandable to someone who executes it ' +
    "without more context, is anything implied but never stated outright? You don't relitigate settled structural " +
    'decisions — that is the architect and skeptic\'s job.',
  providerPreference: rotateProviderOrder(5),
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  toolAllowList: [],
};

const DEFAULT_VISUALIZER: AgentConfig = {
  id: 'default-visualizer',
  name: 'Visualizer',
  role: 'visualizer',
  systemPrompt:
    'You are the visualizer. You never take part in the planning debate itself — you are invoked exactly once, ' +
    'after the plan is finalized, to produce one illustration of it. You draw in a bold, hand-drawn-poster style: ' +
    'thick uniform black outlines, flat pastel fills, a hard offset shadow and a small gloss highlight on every ' +
    'filled shape, plain white background, bold rounded-sans-serif labels. You output nothing but a single ' +
    'self-contained <svg>...</svg> element — no markdown fences, no prose before or after it.',
  providerPreference: rotateProviderOrder(0),
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  toolAllowList: [],
};

/**
 * Upserts rather than insert-once: these are code-defined defaults, not
 * user-customized agents, so they should always reflect whatever's in this
 * file. An insert-once version silently served stale config across a
 * session while iterating on it — worth avoiding here too.
 */
function upsert(config: AgentConfig): AgentConfig {
  db.insert(agents).values(config).onConflictDoUpdate({ target: agents.id, set: config }).run();
  return config;
}

export function getOrCreateDefaultPlanner(): AgentConfig {
  return upsert(DEFAULT_PLANNER);
}

export function getOrCreateDefaultArchitect(): AgentConfig {
  return upsert(DEFAULT_ARCHITECT);
}

export function getOrCreateDefaultSkeptic(): AgentConfig {
  return upsert(DEFAULT_SKEPTIC);
}

export function getOrCreateDefaultDevilsAdvocate(): AgentConfig {
  return upsert(DEFAULT_DEVILS_ADVOCATE);
}

export function getOrCreateDefaultEstimator(): AgentConfig {
  return upsert(DEFAULT_ESTIMATOR);
}

export function getOrCreateDefaultReviewer(): AgentConfig {
  return upsert(DEFAULT_REVIEWER);
}

export function getOrCreateDefaultVisualizer(): AgentConfig {
  return upsert(DEFAULT_VISUALIZER);
}

/**
 * Generic upsert for a caller-built AgentConfig — e.g. a custom per-task
 * roster seat that reuses a default role's provider/model config but swaps
 * in its own id, name, and system prompt. Unlike the getOrCreateDefault*
 * wrappers, the caller owns the config; this just persists it.
 */
export function getOrCreateAgent(config: AgentConfig): AgentConfig {
  return upsert(config);
}

export function getAgent(id: string): AgentConfig | undefined {
  return db.select().from(agents).where(eq(agents.id, id)).get() as AgentConfig | undefined;
}
