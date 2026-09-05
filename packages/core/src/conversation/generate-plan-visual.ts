import type { AgentConfig } from '../domain/agent.js';
import { computeCostUsd } from '../provider/pricing.js';
import { generateForAgent } from '../provider/generate-for-agent.js';
import { recordProviderCall } from '../provider/rate-limit-tracker.js';
import type { FinalizedPlan } from './planning-session.js';

const SVG_PATTERN = /<svg[\s\S]*?<\/svg>/i;

function formatPlan(plan: FinalizedPlan): string {
  const tasks = plan.tasks.map((t, i) => `${i + 1}. ${t.title} — ${t.description}`).join('\n');
  return `Summary: ${plan.summary}\n\nTasks:\n${tasks}`;
}

/**
 * A one-shot illustration step, deliberately outside the round-robin
 * planning loop — the visualizer never debates, it's handed the already-
 * finalized plan exactly once and asked for a single picture of it. Callers
 * (web server, CLI) run this after `runPlanningSession` resolves with a
 * finalized plan, then persist the result with `setConversationPlanVisual`.
 */
export async function generatePlanVisual(opts: { agent: AgentConfig; plan: FinalizedPlan }): Promise<string> {
  const { agent, plan } = opts;

  const prompt = [
    agent.systemPrompt,
    'Illustrate this finalized plan as one diagram — a simple flow of its tasks in order (boxes/steps connected ' +
      'by arrows is fine), not a literal transcription of the text. Keep it to the plan\'s actual shape: if there ' +
      'are 3 tasks, draw 3 steps, not more.',
    formatPlan(plan),
    'Respond with exactly one <svg>...</svg> element and nothing else. viewBox roughly 0 0 480 260 to 0 0 480 320. ' +
      'White background. Bold black outlines (stroke-width 4-6, round caps/joins). Flat pastel fills from: ' +
      '#5b9bd5 (blue), #f5e2cf (cream), #8fc9a0 (green), #f4d35e (yellow), #f2836b (coral), #b8a4d4 (purple). ' +
      'Every filled shape gets a hard offset shadow (a duplicate of the shape, 3-6px down-right, filled with a ' +
      'darker version of its own color, drawn first/behind) and a small translucent white gloss ellipse near its ' +
      'upper-left (opacity 0.3-0.45, drawn last/on top). Bold uppercase labels where useful.',
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

  const match = result.text.match(SVG_PATTERN);
  if (!match) throw new Error('Visualizer did not return an <svg> element');
  return match[0];
}
