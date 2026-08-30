/**
 * The inter-agent communication unit (Phase 3). A structured intent,
 * not a free-text chat blob — that's what lets later phases build real
 * coordination protocols instead of agents just narrating at each other.
 */
export type MessageIntent = 'propose' | 'request' | 'inform' | 'ask_approval';

export interface Message {
  id: string;
  fromAgentId: string;
  /** undefined = broadcast to all agents */
  toAgentId?: string;
  intent: MessageIntent;
  payload: unknown;
  correlationId?: string;
  tick: number;
  createdAt: string;
}
