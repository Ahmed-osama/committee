import { generateText, hasToolCall, stepCountIs, type ToolSet } from 'ai';
import type { AgentConfig } from '../domain/agent.js';
import type { DecisionRecord } from '../domain/run.js';
import type { Task } from '../domain/task.js';
import type { ProviderAdapter } from '../provider/provider-adapter.js';
import { createDevShopTools } from '../tools/dev-shop/dev-shop-tools.js';
import type { GitWorkspace } from '../tools/dev-shop/git-workspace.js';
import { filterForAgent, toToolSet } from '../tools/tool-registry.js';

export interface AgentLoopResult {
  finishReason: string;
  stepCount: number;
  finalSummary: string | undefined;
}

export interface RunAgentLoopOptions {
  agent: AgentConfig;
  task: Task;
  workspace: GitWorkspace;
  provider: ProviderAdapter;
  modelId: string;
  maxSteps?: number;
  /** Rejection feedback from a previous review round, fed back into context on retry. */
  feedback?: string;
  onDecision?: (record: Omit<DecisionRecord, 'id' | 'createdAt'>) => void;
}

/**
 * The perceive→think→act loop, made concrete: "perceive" is the prompt we
 * build below (task + acceptance criteria + any rejection feedback),
 * "think" is each generateText step, "act" is whichever tool the model
 * calls. The AI SDK's stopWhen/tools-with-execute machinery drives the
 * repeat-until-done part — that's HTTP-client plumbing worth reusing, not
 * an agent concept worth hand-rolling.
 */
export async function runAgentLoop(opts: RunAgentLoopOptions): Promise<AgentLoopResult> {
  const { agent, task, workspace, provider, modelId, maxSteps = 12, feedback, onDecision } = opts;

  const allowedTools = filterForAgent(createDevShopTools(workspace), agent.toolAllowList);
  const tools: ToolSet = toToolSet(allowedTools);

  // Folded into the user turn rather than passed as `system`: some small
  // local models (verified: llama3.1:8b via Ollama's OpenAI-compatible
  // endpoint) reliably degrade from real tool_calls to narrating JSON as
  // plain text the moment a separate system message is present alongside
  // tool definitions. Confirmed by isolating it with raw HTTP requests
  // before assuming it was a bug in this loop.
  const promptParts = [agent.systemPrompt, `Task: ${task.description}`, `Acceptance criteria: ${task.acceptanceCriteria}`];
  if (feedback) {
    promptParts.push(`A human reviewer rejected your previous attempt with this feedback: ${feedback}`);
  }
  promptParts.push(
    'Use the available tools to explore the workspace, make the change, and run tests. ' +
      'Call finish_task once tests pass and you are confident the change satisfies the acceptance criteria.',
  );

  let finalSummary: string | undefined;

  const result = await generateText({
    model: provider.model(modelId),
    prompt: promptParts.join('\n\n'),
    tools,
    stopWhen: [stepCountIs(maxSteps), hasToolCall('finish_task')],
    onStepFinish: (step) => {
      for (const call of step.toolCalls) {
        onDecision?.({
          agentId: agent.id,
          taskId: task.id,
          tick: step.stepNumber,
          kind: 'tool_call',
          detail: { name: call.toolName, input: call.input },
        });
        if (call.toolName === 'finish_task') {
          finalSummary = (call.input as { summary?: string }).summary;
        }
      }
      // Recording results, not just calls, matters here specifically: a
      // small model can call finish_task in the same batched step as
      // run_tests without ever having "seen" a failing result — the
      // decision log needs to capture what actually happened, not just
      // what the model attempted, so a reviewer (or a future automated
      // check) can catch that gap instead of trusting the model's summary.
      for (const toolResult of step.toolResults) {
        onDecision?.({
          agentId: agent.id,
          taskId: task.id,
          tick: step.stepNumber,
          kind: 'tool_result',
          detail: { name: toolResult.toolName, output: toolResult.output },
        });
      }
      if (step.toolCalls.length === 0 && step.text) {
        onDecision?.({ agentId: agent.id, taskId: task.id, tick: step.stepNumber, kind: 'idle', detail: { text: step.text } });
      }
    },
  });

  return { finishReason: result.finishReason, stepCount: result.steps.length, finalSummary };
}
