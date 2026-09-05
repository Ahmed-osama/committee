import type { AgentConfig } from '../domain/agent.js';
import { isProviderDown } from './provider-health.js';
import { isProviderConfigured } from './provider-registry.js';
import { getCallCountToday, getRateLimitStatus, getSpendUsdToday } from './rate-limit-tracker.js';

export interface ProviderSelection {
  providerId: string;
  modelId: string;
}

/**
 * Strongest-first, one canonical ranking shared by the whole committee.
 * Giving every role this exact list made every role converge on whichever
 * provider is both strongest and configured (Anthropic, when its key is
 * set) — diversity only shows up as a fallback when that one provider is
 * down. `rotateProviderOrder` below is how a role gets a *different*
 * primary while still falling back through the rest of this list in
 * strength order.
 */
export const PROVIDER_STRENGTH_ORDER = ['anthropic', 'gemini', 'groq', 'deepseek', 'glm', 'openrouter', 'perplexity', 'ollama'];

/**
 * Same set, same relative strength order, just rotated to start `offset`
 * entries in — e.g. offset 1 tries gemini first, then groq, deepseek, glm,
 * ollama, and only then anthropic. Assigning each role a different offset
 * spreads the committee across its configured providers instead of every
 * role picking the single strongest one; each role still has a complete
 * strength-ordered fallback chain if its primary isn't configured/available.
 */
export function rotateProviderOrder(offset: number): string[] {
  const n = PROVIDER_STRENGTH_ORDER.length;
  const start = ((offset % n) + n) % n;
  return [...PROVIDER_STRENGTH_ORDER.slice(start), ...PROVIDER_STRENGTH_ORDER.slice(0, start)];
}

const DAILY_CALL_CEILING = Number(process.env.COMMITTEE_DAILY_CALL_CEILING ?? 200);
const DAILY_SPEND_USD_CEILING = Number(process.env.COMMITTEE_DAILY_SPEND_USD_CEILING ?? 5);

/**
 * Walks the agent's provider preference list and returns the first one
 * that's configured (has an API key, or is Ollama) and not currently
 * rate-limited. The daily call-count and $-spend ceilings hard-stop
 * everything for this agent when hit — per the plan's safety invariants,
 * that means refusing outright, not silently falling back to a "free"
 * provider, since a stuck agent burning through free-tier quota all day
 * is still a problem even at $0.
 */
export function selectProvider(agent: AgentConfig): ProviderSelection {
  const callsToday = getCallCountToday(agent.id);
  if (callsToday >= DAILY_CALL_CEILING) {
    throw new Error(`Agent ${agent.id} hit its daily call ceiling (${DAILY_CALL_CEILING}) — refusing further LLM calls today.`);
  }

  const spendToday = getSpendUsdToday(agent.id);
  if (spendToday >= DAILY_SPEND_USD_CEILING) {
    throw new Error(`Agent ${agent.id} hit its daily spend ceiling ($${DAILY_SPEND_USD_CEILING}) — refusing further LLM calls today.`);
  }

  for (const providerId of agent.providerPreference) {
    const modelId = agent.modelByProvider[providerId];
    if (!modelId) continue;
    if (!isProviderConfigured(providerId)) continue;
    if (isProviderDown(providerId, modelId)) continue;

    const status = getRateLimitStatus(providerId, modelId);
    if (!status.availableNow) continue;

    return { providerId, modelId };
  }

  throw new Error(
    `No usable provider for agent ${agent.id}: every entry in [${agent.providerPreference.join(', ')}] is unconfigured (missing API key) or rate-limited right now.`,
  );
}

/** Whether this agent currently has at least one usable provider — used to build the roster before a conversation starts. */
export function isAgentReady(agent: AgentConfig): boolean {
  try {
    selectProvider(agent);
    return true;
  } catch {
    return false;
  }
}
