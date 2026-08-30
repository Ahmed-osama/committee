import { runAgentLoop } from '../agent/agent-loop.js';
import type { AgentConfig } from '../domain/agent.js';
import { requestApproval } from '../persistence/repositories/approval-repo.js';
import { recordDecision } from '../persistence/repositories/decision-repo.js';
import { getLatestFeedback } from '../persistence/repositories/feedback.js';
import { sendMessage } from '../persistence/repositories/message-repo.js';
import { recordReviewVerdict } from '../persistence/repositories/review-repo.js';
import {
  alertIfRetriesExhausted,
  findNextCoderTask,
  findNextReviewTask,
  retryTask,
  transitionTask,
} from '../persistence/repositories/task-repo.js';
import { GitWorkspace } from '../tools/dev-shop/git-workspace.js';
import { createReviewTools } from '../tools/dev-shop/review-tools.js';
import type { EventBus } from './event-bus.js';

export interface AgentTurnOutcome {
  agentId: string;
  taskId?: string;
  action: 'idle' | 'coded' | 'reviewed' | 'error';
  detail?: string;
}

/**
 * What one agent does when a tick wakes it up. This is the actual
 * perceive→think→act step at the orchestrator level: "perceive" is
 * findNextCoderTask/findNextReviewTask (what, if anything, needs this
 * agent's attention right now), "think→act" is runAgentLoop. An agent with
 * nothing to do returns 'idle' without ever calling an LLM — ticks are a
 * clock, not a mandate to spend money every generation.
 */
export async function takeAgentTurn(agent: AgentConfig, tick: number, bus: EventBus): Promise<AgentTurnOutcome> {
  if (agent.role === 'coder') return takeCoderTurn(agent, tick, bus);
  if (agent.role === 'reviewer') return takeReviewerTurn(agent, tick, bus);
  return { agentId: agent.id, action: 'idle' };
}

async function takeCoderTurn(agent: AgentConfig, tick: number, bus: EventBus): Promise<AgentTurnOutcome> {
  const found = findNextCoderTask(agent.id);
  if (!found) return { agentId: agent.id, action: 'idle' };

  let task = found;
  let workspace: GitWorkspace;

  if (task.status === 'rejected') {
    // Auto-retry: the coder reacting to a rejection with no human ever
    // typing `task retry` is the concrete "keeps working without a
    // prompt" behavior ticks exist to enable.
    task = retryTask(task.id);
    workspace = GitWorkspace.reattach(task);
  } else if (task.status === 'pending') {
    workspace = GitWorkspace.create(task);
    task = transitionTask(task.id, 'claimed', { assignedAgentId: agent.id, workspacePath: workspace.path });
    task = transitionTask(task.id, 'in_progress');
  } else {
    workspace = task.workspacePath ? GitWorkspace.reattach(task) : GitWorkspace.create(task);
    if (task.status === 'claimed') task = transitionTask(task.id, 'in_progress');
  }

  const feedback = getLatestFeedback(task.id);
  const result = await runAgentLoop({
    agent,
    task,
    workspace,
    feedback,
    onDecision: (d) => recordDecision(d),
  });

  if (!result.finalSummary) {
    return { agentId: agent.id, taskId: task.id, action: 'coded', detail: 'still working (hit step budget)' };
  }

  transitionTask(task.id, 'pending_auto_review');
  bus.emitTaskStatusChanged({ taskId: task.id, from: 'in_progress', to: 'pending_auto_review' });
  const message = sendMessage({
    fromAgentId: agent.id,
    intent: 'inform',
    payload: { taskId: task.id, kind: 'ready_for_review', summary: result.finalSummary },
    tick,
  });
  bus.emitMessage(message);

  return { agentId: agent.id, taskId: task.id, action: 'coded', detail: 'submitted for automated review' };
}

async function takeReviewerTurn(agent: AgentConfig, tick: number, bus: EventBus): Promise<AgentTurnOutcome> {
  const task = findNextReviewTask();
  if (!task) return { agentId: agent.id, action: 'idle' };

  const workspace = GitWorkspace.reattach(task);
  const result = await runAgentLoop({
    agent,
    task,
    workspace,
    buildTools: createReviewTools,
    stopToolNames: ['approve_for_human', 'request_changes'],
    closingInstruction:
      'Independently re-run tests yourself before deciding — do not trust the task description alone. ' +
      'Call approve_for_human if this is genuinely ready to ship, or request_changes with specific, actionable ' +
      'feedback the coder can act on if not.',
    onDecision: (d) => recordDecision(d),
  });

  if (result.terminalTool === 'approve_for_human') {
    recordReviewVerdict({ taskId: task.id, agentId: agent.id, verdict: 'approve', feedback: result.finalSummary });
    transitionTask(task.id, 'awaiting_review');
    requestApproval(task.id);
    bus.emitTaskStatusChanged({ taskId: task.id, from: 'pending_auto_review', to: 'awaiting_review' });
    const message = sendMessage({
      fromAgentId: agent.id,
      intent: 'inform',
      payload: { taskId: task.id, kind: 'passed_review' },
      tick,
    });
    bus.emitMessage(message);
    return { agentId: agent.id, taskId: task.id, action: 'reviewed', detail: 'approved for human review' };
  }

  if (result.terminalTool === 'request_changes') {
    recordReviewVerdict({ taskId: task.id, agentId: agent.id, verdict: 'request_changes', feedback: result.finalSummary });
    transitionTask(task.id, 'rejected');
    bus.emitTaskStatusChanged({ taskId: task.id, from: 'pending_auto_review', to: 'rejected' });
    const message = sendMessage({
      fromAgentId: agent.id,
      toAgentId: task.assignedAgentId,
      intent: 'request',
      payload: { taskId: task.id, feedback: result.finalSummary },
      tick,
    });
    bus.emitMessage(message);
    alertIfRetriesExhausted(task);

    return { agentId: agent.id, taskId: task.id, action: 'reviewed', detail: 'requested changes' };
  }

  // Ran out of step budget without deciding — leave it in pending_auto_review, picked up again next tick.
  return { agentId: agent.id, taskId: task.id, action: 'reviewed', detail: 'no verdict yet (hit step budget)' };
}
