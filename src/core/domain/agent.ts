export type AgentRole = 'coder' | 'reviewer' | 'triage';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  /** Ordered provider ids to try, e.g. ['ollama', 'groq', 'anthropic'] — used by the router in Phase 2. */
  providerPreference: string[];
  toolAllowList: string[];
}

export type AgentState = 'idle' | 'thinking' | 'acting' | 'blocked_on_approval';

export interface AgentRuntimeState {
  agentId: string;
  state: AgentState;
  currentTaskId?: string;
  updatedAt: string;
}
