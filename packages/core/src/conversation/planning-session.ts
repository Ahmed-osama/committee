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

const DEFAULT_MAX_TURNS = 15;

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

/**
 * True agreement, not silence: the skeptic must have explicitly called the
 * agree tool — its most recent turn can't be a live, unaddressed
 * objection — or there's no real basis for calling this a settled plan
 * rather than one side just deciding to stop listening.
 */
export function hasSkepticAgreed(transcript: Message[], skepticId: string | undefined): boolean {
  if (!skepticId) return true;
  const lastSkepticMessage = [...transcript].reverse().find((m) => m.fromAgentId === skepticId);
  return lastSkepticMessage?.intent === 'agree';
}

function intentForRole(role: AgentRole): Message['intent'] {
  return role === 'skeptic' ? 'challenge' : 'propose';
}

/**
 * A round-robin multi-agent dialogue, not a single agent's tool loop — each
 * turn is one agent, given the full transcript so far, producing one new
 * turn. Only the designated finalizer can end it, and only once the
 * skeptic has explicitly agreed — by calling finalize_plan/agree instead
 * of speaking. Publishing the resulting plan anywhere (Linear, once
 * connected) is deliberately a separate, deterministic step outside this
 * function — once the shape of the plan is known, mapping it to Linear
 * issues doesn't need another LLM call, it needs code that reliably does
 * the same thing every time.
 */
export async function runPlanningSession(opts: PlanningSessionOptions): Promise<PlanningSessionResult> {
  const { conversationId, goal, agents, finalizerAgentId, maxTurns = DEFAULT_MAX_TURNS, onMessage } = opts;
  const transcript: Message[] = [];
  const skeptic = agents.find((a) => a.role === 'skeptic');
  let plan: FinalizedPlan | undefined;
  let agreementNote: string | undefined;

  const finalizeTool = tool({
    description: 'Call this once the plan is genuinely settled and the skeptic has agreed — ends the conversation.',
    inputSchema: z.object({
      summary: z.string().describe('One-paragraph summary of the agreed plan'),
      tasks: z.array(z.object({ title: z.string(), description: z.string() })).describe('The concrete task breakdown, in order'),
    }),
    execute: (input) => {
      plan = input;
      return 'Plan finalized.';
    },
  });

  const agreeTool = tool({
    description: 'Call this once you have no further real objections — signals genuine agreement instead of speaking.',
    inputSchema: z.object({ note: z.string().describe('Briefly why you are satisfied, not just "looks good"') }),
    execute: (input) => {
      agreementNote = input.note;
      return `Agreed: ${input.note}`;
    },
  });

  for (let turn = 0; turn < maxTurns; turn++) {
    const agent = agents[turn % agents.length];
    const isSkeptic = agent.id === skeptic?.id;
    const isFinalizer = agent.id === finalizerAgentId && canOfferFinalize(turn, agents.length) && hasSkepticAgreed(transcript, skeptic?.id);
    const tools: ToolSet = isFinalizer ? { finalize_plan: finalizeTool } : isSkeptic ? { agree: agreeTool } : {};

    const { providerId, modelId } = selectProvider(agent);
    const provider = PROVIDER_REGISTRY[providerId];

    const promptParts = [
      agent.systemPrompt,
      `The goal: ${goal}`,
      transcript.length
        ? `Conversation so far:\n\n${formatTranscript(transcript, agents)}`
        : '(You are speaking first — open with a concrete initial proposal, not a restatement of the goal.)',
      `Now speak as ${agent.name}. A few sentences, no filler.` +
        (isFinalizer ? ' If the plan is genuinely settled, call finalize_plan instead of speaking.' : '') +
        (isSkeptic ? ' If you have no further real objections, call agree instead of speaking.' : ''),
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

    const content = agreementNote ?? (result.text.trim() || '(no response this turn)');
    const intent: Message['intent'] = agreementNote !== undefined ? 'agree' : intentForRole(agent.role);
    const message = sendMessage({ conversationId, fromAgentId: agent.id, intent, content, turn });
    transcript.push(message);
    onMessage?.(message);
    agreementNote = undefined;
  }

  return { finalized: false, turnsUsed: maxTurns };
}
