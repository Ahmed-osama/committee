export type ConversationStatus = 'in_progress' | 'finalized' | 'failed';

export interface Conversation {
  id: string;
  goal: string;
  status: ConversationStatus;
  linearEpicUrl?: string;
  createdAt: string;
  updatedAt: string;
}
