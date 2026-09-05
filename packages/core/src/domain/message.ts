/**
 * One turn in a planning conversation. A structured intent plus the actual
 * text the agent said — planning is fundamentally argumentative/verbal, not
 * just structured signals, so unlike a pure task-coordination message this
 * carries real content, not just a payload.
 */
export type MessageIntent = 'propose' | 'challenge' | 'clarify' | 'agree' | 'finalize' | 'human' | 'error';

/** Sentinel fromAgentId for a message injected by the human watching the conversation, not any agent. */
export const HUMAN_AGENT_ID = 'human';

export interface Message {
  id: string;
  conversationId: string;
  fromAgentId: string;
  /** undefined = broadcast to the whole conversation — the normal case; a shared conversation has no private turns. */
  toAgentId?: string;
  intent: MessageIntent;
  content: string;
  /** Structured data attached to this turn — e.g. the finalized task list on a 'finalize' turn. */
  payload?: unknown;
  /** Which provider/model actually answered this turn — can vary turn to turn under rate-limit fallback. Undefined for human-injected messages. */
  providerId?: string;
  modelId?: string;
  turn: number;
  createdAt: string;
}
