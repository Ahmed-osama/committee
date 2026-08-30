/**
 * One turn in a planning conversation. A structured intent plus the actual
 * text the agent said — planning is fundamentally argumentative/verbal, not
 * just structured signals, so unlike a pure task-coordination message this
 * carries real content, not just a payload.
 */
export type MessageIntent = 'propose' | 'challenge' | 'clarify' | 'agree' | 'finalize';

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
  turn: number;
  createdAt: string;
}
