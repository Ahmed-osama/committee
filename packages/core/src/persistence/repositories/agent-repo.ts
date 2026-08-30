import { eq } from 'drizzle-orm';
import type { AgentConfig } from '../../domain/agent.js';
import { db } from '../db.js';
import { agents } from '../schema.js';

// Every model id here was verified live against the provider's own API
// before being added — cached "current" model names turned out stale for
// both Gemini and Groq within one session, so nothing is hardcoded blind.
const SHARED_PROVIDER_PREFERENCE = ['groq', 'gemini', 'ollama', 'anthropic'];
const SHARED_MODEL_BY_PROVIDER = {
  groq: 'qwen/qwen3.8-27b',
  gemini: 'gemini-3.6-flash',
  ollama: 'llama3.1:8b',
  anthropic: 'claude-sonnet-5',
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
  providerPreference: SHARED_PROVIDER_PREFERENCE,
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
  providerPreference: SHARED_PROVIDER_PREFERENCE,
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
  providerPreference: SHARED_PROVIDER_PREFERENCE,
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

export function getAgent(id: string): AgentConfig | undefined {
  return db.select().from(agents).where(eq(agents.id, id)).get() as AgentConfig | undefined;
}
