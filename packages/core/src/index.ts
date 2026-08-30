// Public API of @committee/core — the agent engine. Apps (the CLI today,
// the dashboard later) only ever import from here, never reach into
// subpaths directly, so the internal module layout can keep changing
// underneath this file without breaking consumers.

export type { AgentConfig, AgentRole, AgentRuntimeState, AgentState } from './domain/agent.js';
export type { Approval, ApprovalStatus } from './domain/approval.js';
export type { Message, MessageIntent } from './domain/message.js';
export type { DecisionKind, DecisionRecord } from './domain/run.js';
export { canTransition, transition, TASK_TRANSITIONS } from './domain/task.js';
export type { Task, TaskStatus } from './domain/task.js';
export type { ToolCostClass, ToolDefinition, ToolMetadata } from './domain/tool.js';

export { runAgentLoop } from './agent/agent-loop.js';
export type { AgentLoopResult, RunAgentLoopOptions } from './agent/agent-loop.js';

export { approve, reject, submitForReview } from './approval/approval-gate.js';
export { approveTask, rejectTask } from './approval/approve-task.js';
export type { ApproveTaskResult } from './approval/approve-task.js';

export type { ProviderAdapter } from './provider/provider-adapter.js';
export { ollamaAdapter } from './provider/ollama-adapter.js';
export { groqAdapter } from './provider/groq-adapter.js';
export { geminiAdapter } from './provider/gemini-adapter.js';
export { anthropicAdapter } from './provider/anthropic-adapter.js';
export { deepseekAdapter } from './provider/deepseek-adapter.js';
export { glmAdapter } from './provider/glm-adapter.js';
export { PROVIDER_REGISTRY, isProviderConfigured } from './provider/provider-registry.js';
export { selectProvider } from './provider/provider-router.js';
export type { ProviderSelection } from './provider/provider-router.js';
export { getRateLimitStatus, getCallCountToday, getSpendUsdToday } from './provider/rate-limit-tracker.js';
export type { RateLimitStatus } from './provider/rate-limit-tracker.js';
export { computeCostUsd } from './provider/pricing.js';

export { GitWorkspace } from './tools/dev-shop/git-workspace.js';
export type { CommandResult } from './tools/dev-shop/git-workspace.js';
export { createDevShopTools } from './tools/dev-shop/dev-shop-tools.js';
export { createReviewTools } from './tools/dev-shop/review-tools.js';
export { filterForAgent, toToolSet } from './tools/tool-registry.js';
export { createPullRequest, tryGetGitHubRemote, parseGitHubRemote } from './tools/dev-shop/create-pr.js';
export type { CreatePrInput, CreatePrResult } from './tools/dev-shop/create-pr.js';

export { EventBus } from './orchestrator/event-bus.js';
export type { TaskStatusChangedEvent } from './orchestrator/event-bus.js';
export { takeAgentTurn } from './orchestrator/agent-turn.js';
export type { AgentTurnOutcome } from './orchestrator/agent-turn.js';
export { advanceTicks } from './orchestrator/tick-scheduler.js';
export type { AdvanceTicksOptions } from './orchestrator/tick-scheduler.js';

export { startDashboardServer } from './server/dashboard-server.js';
export type { StartDashboardServerOptions, DashboardServerHandle } from './server/dashboard-server.js';

export { db } from './persistence/db.js';
export * as schema from './persistence/schema.js';
export { getOrCreateDefaultCoder, getOrCreateDefaultReviewer } from './persistence/repositories/agent-repo.js';
export { getLatestRejectionFeedback, requestApproval, resolveApproval } from './persistence/repositories/approval-repo.js';
export { recordDecision, getDecisionsForTask } from './persistence/repositories/decision-repo.js';
export { getLatestFeedback } from './persistence/repositories/feedback.js';
export { sendMessage, getMessagesForAgent, getAllMessages } from './persistence/repositories/message-repo.js';
export { recordReviewVerdict, getLatestReviewerFeedback } from './persistence/repositories/review-repo.js';
export type { ReviewVerdict } from './persistence/repositories/review-repo.js';
export { getCurrentTick, pauseScheduler, resumeScheduler, isPaused } from './persistence/repositories/scheduler-repo.js';
export { recordAlert, getUnacknowledgedAlerts, acknowledgeAllAlerts } from './persistence/repositories/alert-repo.js';
export type { Alert, AlertKind } from './persistence/repositories/alert-repo.js';
export {
  MAX_RETRIES,
  createTask,
  getTask,
  retryTask,
  saveTask,
  transitionTask,
  findNextCoderTask,
  findNextReviewTask,
  alertIfRetriesExhausted,
  getAllTasks,
} from './persistence/repositories/task-repo.js';
