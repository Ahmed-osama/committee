export type DecisionKind = 'llm_call' | 'tool_call' | 'tool_result' | 'message' | 'idle';

export interface DecisionRecord {
  id: string;
  agentId: string;
  taskId?: string;
  tick: number;
  kind: DecisionKind;
  detail: unknown;
  createdAt: string;
}
