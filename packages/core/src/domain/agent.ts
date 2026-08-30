export type AgentRole = 'coder' | 'reviewer' | 'triage';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  /** Ordered provider ids to try, e.g. ['groq', 'gemini', 'ollama', 'anthropic'] — walked by the ProviderRouter. */
  providerPreference: string[];
  /** Which model to use on each provider in providerPreference, e.g. { anthropic: 'claude-sonnet-5' }. */
  modelByProvider: Record<string, string>;
  toolAllowList: string[];
}

export type AgentState = 'idle' | 'thinking' | 'acting' | 'blocked_on_approval';

export interface AgentRuntimeState {
  agentId: string;
  state: AgentState;
  currentTaskId?: string;
  updatedAt: string;
}
