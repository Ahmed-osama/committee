import type { AgentConfig } from '../domain/agent.js';
import { isProviderConfigured } from './provider-registry.js';
import { getCallCountToday, getRateLimitStatus, getSpendUsdToday } from './rate-limit-tracker.js';

export interface ProviderSelection {
  providerId: string;
  modelId: string;
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

    const status = getRateLimitStatus(providerId, modelId);
    if (!status.availableNow) continue;

    return { providerId, modelId };
  }

  throw new Error(
    `No usable provider for agent ${agent.id}: every entry in [${agent.providerPreference.join(', ')}] is unconfigured (missing API key) or rate-limited right now.`,
  );
}
