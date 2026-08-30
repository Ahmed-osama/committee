// Public API of @committee/core. Apps only ever import from here, never
// reach into subpaths directly, so internal layout can keep changing
// underneath this file without breaking consumers.

export type { AgentConfig, AgentRole } from './domain/agent.js';
export type { Conversation, ConversationStatus } from './domain/conversation.js';
export type { Message, MessageIntent } from './domain/message.js';
export type { ToolCostClass, ToolDefinition, ToolMetadata } from './domain/tool.js';

export { runPlanningSession } from './conversation/planning-session.js';
export type { FinalizedPlan, PlanTask, PlanningSessionOptions, PlanningSessionResult } from './conversation/planning-session.js';

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

export { EventBus } from './orchestrator/event-bus.js';

export { startWebServer } from './server/web-server.js';
export type { WebServerHandle } from './server/web-server.js';

export { db } from './persistence/db.js';
export * as schema from './persistence/schema.js';
export {
  getOrCreateDefaultPlanner,
  getOrCreateDefaultArchitect,
  getOrCreateDefaultSkeptic,
  getAgent,
} from './persistence/repositories/agent-repo.js';
export { createConversation, getConversation, updateConversationStatus } from './persistence/repositories/conversation-repo.js';
export { sendMessage, getConversationTranscript } from './persistence/repositories/message-repo.js';
