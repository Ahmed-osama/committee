export type AgentRole = 'planner' | 'architect' | 'skeptic' | 'devils_advocate' | 'estimator' | 'reviewer' | 'visualizer';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  /** Ordered provider ids to try, e.g. ['groq', 'gemini', 'ollama', 'anthropic'] — walked by the ProviderRouter. */
  providerPreference: string[];
  /** Which model to use on each provider in providerPreference, e.g. { anthropic: 'claude-sonnet-5' }. */
  modelByProvider: Record<string, string>;
  /** Only meaningful for whichever agent finalizes the plan — the rest of the conversation is pure dialogue, no tool calls. */
  toolAllowList: string[];
}
