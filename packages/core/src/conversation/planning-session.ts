import { generateText, tool, type ToolSet } from 'ai';
import { z } from 'zod';
import type { AgentConfig, AgentRole } from '../domain/agent.js';
import type { Message } from '../domain/message.js';
import { sendMessage } from '../persistence/repositories/message-repo.js';
import { computeCostUsd } from '../provider/pricing.js';
import { PROVIDER_REGISTRY } from '../provider/provider-registry.js';
import { selectProvider } from '../provider/provider-router.js';
import { recordProviderCall } from '../provider/rate-limit-tracker.js';

export interface PlanTask {
  title: string;
  description: string;
}

export interface FinalizedPlan {
  summary: string;
  tasks: PlanTask[];
}

export interface PlanningSessionOptions {
  conversationId: string;
  goal: string;
  /** Round-robin speaking order. */
  agents: AgentConfig[];
  /** Which agent's finalize_plan call ends the conversation. */
  finalizerAgentId: string;
  maxTurns?: number;
  onMessage?: (message: Message) => void;
}

export interface PlanningSessionResult {
  finalized: boolean;
  plan?: FinalizedPlan;
  turnsUsed: number;
}

const DEFAULT_MAX_TURNS = 12;

function formatTranscript(transcript: Message[], agents: AgentConfig[]): string {
  const nameFor = (id: string) => agents.find((a) => a.id === id)?.name ?? id;
  return transcript.map((m) => `${nameFor(m.fromAgentId)}: ${m.content}`).join('\n\n');
}

/**
 * Whether it's even legal to offer finalize_plan on this turn. Extracted as
 * its own testable function because getting this wrong is exactly what
 * happened on the first real run: the finalizer's tool was offered on its
 * very first turn, before agents later in the speaking order (the skeptic)
 * had said anything at all, so the conversation finalized having never
 * heard the one role whose entire job is to stress-test the plan.
 */
export function canOfferFinalize(turn: number, agentCount: number): boolean {
  return turn >= agentCount;
}

function intentForRole(role: AgentRole): Message['intent'] {
  return role === 'skeptic' ? 'challenge' : 'propose';
}

/**
 * A round-robin multi-agent dialogue, not a single agent's tool loop — each
 * turn is one agent, given the full transcript so far, producing one new
 * turn. Only the designated finalizer can end it, by calling finalize_plan
 * instead of speaking; everyone else just talks. Publishing the resulting
 * plan anywhere (Linear, a file, whatever) is deliberately a separate,
 * deterministic step outside this function — once the shape of the plan is
 * known, mapping it to Linear issues doesn't need another LLM call, it
 * needs code that reliably does the same thing every time.
 */
export async function runPlanningSession(opts: PlanningSessionOptions): Promise<PlanningSessionResult> {
  const { conversationId, goal, agents, finalizerAgentId, maxTurns = DEFAULT_MAX_TURNS, onMessage } = opts;
  const transcript: Message[] = [];
  let plan: FinalizedPlan | undefined;

  const finalizeTool = tool({
    description: 'Call this once the plan is genuinely settled and stress-tested — ends the conversation.',
    inputSchema: z.object({
      summary: z.string().describe('One-paragraph summary of the agreed plan'),
      tasks: z.array(z.object({ title: z.string(), description: z.string() })).describe('The concrete task breakdown, in order'),
    }),
    execute: (input) => {
      plan = input;
      return 'Plan finalized.';
    },
  });

  for (let turn = 0; turn < maxTurns; turn++) {
    const agent = agents[turn % agents.length];
    const isFinalizer = agent.id === finalizerAgentId && canOfferFinalize(turn, agents.length);
    const tools: ToolSet = isFinalizer ? { finalize_plan: finalizeTool } : {};

    const { providerId, modelId } = selectProvider(agent);
    const provider = PROVIDER_REGISTRY[providerId];

    const promptParts = [
      agent.systemPrompt,
      `The goal: ${goal}`,
      transcript.length
        ? `Conversation so far:\n\n${formatTranscript(transcript, agents)}`
        : '(You are speaking first — open with a concrete initial proposal, not a restatement of the goal.)',
      `Now speak as ${agent.name}. A few sentences, no filler.` +
        (isFinalizer ? ' If the plan is genuinely settled, call finalize_plan instead of speaking.' : ''),
    ];

    const result = await generateText({
      model: provider.model(modelId),
      prompt: promptParts.join('\n\n'),
      tools: Object.keys(tools).length ? tools : undefined,
    });

    recordProviderCall({
      agentId: agent.id,
      providerId,
      modelId,
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      costUsd: computeCostUsd(providerId, modelId, result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0),
    });

    if (plan) {
      const message = sendMessage({ conversationId, fromAgentId: agent.id, intent: 'finalize', content: plan.summary, payload: plan, turn });
      onMessage?.(message);
      return { finalized: true, plan, turnsUsed: turn + 1 };
    }

    const content = result.text.trim() || '(no response this turn)';
    const message = sendMessage({ conversationId, fromAgentId: agent.id, intent: intentForRole(agent.role), content, turn });
    transcript.push(message);
    onMessage?.(message);
  }

  return { finalized: false, turnsUsed: maxTurns };
}
