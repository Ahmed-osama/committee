import { generateText, type ToolSet } from 'ai';
import type { AgentConfig } from '../domain/agent.js';
import { markProviderDown } from './provider-health.js';
import { PROVIDER_REGISTRY } from './provider-registry.js';
import { selectProvider } from './provider-router.js';

export interface GenerateForAgentOptions {
  /** Lets a multi-step tool loop (e.g. execution turns) run several tool calls before stopping. */
  stopWhen?: Parameters<typeof generateText>[0]['stopWhen'];
}

/**
 * One agent's turn can fail for reasons our proactive rate-limit tracker
 * can't see coming — e.g. a provider's real free-tier quota being stricter
 * than what we've configured. Rather than let one bad provider kill the
 * whole conversation, fall back through the rest of the agent's preference
 * list, marking each failure down so the very next selection steers clear
 * of it. Only propagates if every configured provider for this agent is
 * exhausted or down.
 */
export async function generateForAgent(
  agent: AgentConfig,
  prompt: string,
  tools: ToolSet,
  options: GenerateForAgentOptions = {},
): Promise<{ result: Awaited<ReturnType<typeof generateText>>; providerId: string; modelId: string }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < agent.providerPreference.length; attempt++) {
    const { providerId, modelId } = selectProvider(agent);
    const provider = PROVIDER_REGISTRY[providerId];
    try {
      const result = await generateText({
        model: provider.model(modelId),
        prompt,
        tools: Object.keys(tools).length ? tools : undefined,
        ...options,
      });
      return { result, providerId, modelId };
    } catch (err) {
      markProviderDown(providerId, modelId);
      lastError = err;
    }
  }
  throw lastError;
}
