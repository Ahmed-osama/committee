import { stepCountIs } from 'ai';
import type { AgentConfig } from '../domain/agent.js';
import { HUMAN_AGENT_ID, type Message } from '../domain/message.js';
import { getConversationTranscript, sendMessage } from '../persistence/repositories/message-repo.js';
import { generateForAgent } from '../provider/generate-for-agent.js';
import { computeCostUsd } from '../provider/pricing.js';
import { recordProviderCall } from '../provider/rate-limit-tracker.js';
import { executionTools } from './tools.js';

const MAX_STEPS = 8;

export interface ExecutionTurnResult {
  humanMessage: Message;
  agentMessage: Message;
}

/**
 * Runs one human-issued command against the real codebase once a plan has
 * already been finalized (or the planning session otherwise ended) — a
 * single agent acting with real shell/file tools, not another round of the
 * planning debate. Distinct from the round-robin loop in planning-session.ts
 * on purpose: this is execution, triggered one command at a time by a human,
 * not multi-agent deliberation.
 */
export async function runExecutionTurn(opts: { conversationId: string; agent: AgentConfig; command: string; turn: number }): Promise<ExecutionTurnResult> {
  const { conversationId, agent, command, turn } = opts;

  const humanMessage = sendMessage({ conversationId, fromAgentId: HUMAN_AGENT_ID, intent: 'human', content: command, turn });

  const history = getConversationTranscript(conversationId)
    .map((m) => `${m.fromAgentId === HUMAN_AGENT_ID ? 'Human' : m.fromAgentId}: ${m.content}`)
    .join('\n\n');

  const prompt = [
    agent.systemPrompt,
    "The plan above has already been settled — you're no longer debating it. You now have real tools " +
      '(run_command, read_file, write_file) to act directly on the actual codebase at the repo root. ' +
      "Carry out the human's request yourself using those tools, then report back concisely what you did.",
    `Conversation so far:\n\n${history}`,
  ].join('\n\n');

  try {
    const { result, providerId, modelId } = await generateForAgent(agent, prompt, executionTools, { stopWhen: stepCountIs(MAX_STEPS) });
    recordProviderCall({
      agentId: agent.id,
      providerId,
      modelId,
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      costUsd: computeCostUsd(providerId, modelId, result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0),
    });
    const agentMessage = sendMessage({
      conversationId,
      fromAgentId: agent.id,
      intent: 'propose',
      content: result.text.trim() || '(done — no summary returned)',
      providerId,
      modelId,
      turn: turn + 1,
    });
    return { humanMessage, agentMessage };
  } catch (err) {
    const agentMessage = sendMessage({
      conversationId,
      fromAgentId: agent.id,
      intent: 'error',
      content: `Couldn't run that: ${err instanceof Error ? err.message : String(err)}`,
      turn: turn + 1,
    });
    return { humanMessage, agentMessage };
  }
}
