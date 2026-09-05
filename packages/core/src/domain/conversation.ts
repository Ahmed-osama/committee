export type ConversationStatus = 'in_progress' | 'finalized' | 'failed' | 'stopped';

export interface Conversation {
  id: string;
  goal: string;
  status: ConversationStatus;
  linearEpicUrl?: string;
  /** Inline SVG produced by the visualizer agent once the plan finalizes — undefined until then. */
  planVisualSvg?: string;
  createdAt: string;
  updatedAt: string;
}
