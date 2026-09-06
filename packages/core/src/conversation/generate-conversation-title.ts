import type { AgentConfig } from '../domain/agent.js';
import { computeCostUsd } from '../provider/pricing.js';
import { generateForAgent } from '../provider/generate-for-agent.js';
import { recordProviderCall } from '../provider/rate-limit-tracker.js';

/** Hard cap independent of whether the model actually follows the "4-6 words" instruction — the sidebar
 * renders a single-line ellipsis regardless, but a runaway title shouldn't sit untruncated in the database. */
const MAX_TITLE_LENGTH = 60;

/**
 * A one-shot, out-of-band call — like `generatePlanVisual`, deliberately
 * outside the round-robin loop — so the sidebar has something short to show
 * instead of the raw goal text. Callers fire this right after
 * `createConversation` and persist the result with `setConversationTitle`.
 */
export async function generateConversationTitle(opts: { agent: AgentConfig; goal: string }): Promise<string> {
  const { agent, goal } = opts;

  const prompt = [
    'Write a short title (4-6 words) for the following goal, suitable as a sidebar label in a chat app.',
    'No quotes, no punctuation at the end, no restating "goal:" or similar prefix — just the title itself.',
    `Goal: ${goal}`,
  ].join('\n\n');

  const { result, providerId, modelId } = await generateForAgent(agent, prompt, {});

  recordProviderCall({
    agentId: agent.id,
    providerId,
    modelId,
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
    costUsd: computeCostUsd(providerId, modelId, result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0),
  });

  const title = result.text.trim().replace(/^["'“”]|["'“”]$/g, '');
  return title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd() + '…' : title;
}
