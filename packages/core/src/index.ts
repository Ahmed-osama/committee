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
export { filterForAgent, toToolSet } from './tools/tool-registry.js';

export { db } from './persistence/db.js';
export * as schema from './persistence/schema.js';
export { getOrCreateDefaultCoder } from './persistence/repositories/agent-repo.js';
export { getLatestRejectionFeedback, requestApproval, resolveApproval } from './persistence/repositories/approval-repo.js';
export { recordDecision, getDecisionsForTask } from './persistence/repositories/decision-repo.js';
export { MAX_RETRIES, createTask, getTask, retryTask, saveTask, transitionTask } from './persistence/repositories/task-repo.js';
