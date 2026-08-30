// Mirrors of @committee/core's REST/WS JSON shapes. Not imported directly —
// that package pulls in Node-only deps (better-sqlite3, the AI SDKs) that
// can't be bundled for a browser, so the API's JSON contract is the actual
// boundary here, not a shared TS import.

export type TaskStatus =
  | 'pending'
  | 'claimed'
  | 'in_progress'
  | 'pending_auto_review'
  | 'awaiting_review'
  | 'approved'
  | 'rejected'
  | 'done';

export interface Task {
  id: string;
  description: string;
  acceptanceCriteria: string;
  repoPath: string;
  baseBranch: string;
  status: TaskStatus;
  assignedAgentId?: string;
  workspacePath?: string;
  prUrl?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working';
  taskId?: string;
}

export interface DecisionRecord {
  id: string;
  agentId: string;
  taskId?: string;
  tick: number;
  kind: string;
  detail: unknown;
  createdAt: string;
}

export interface Message {
  id: string;
  fromAgentId: string;
  toAgentId?: string;
  intent: string;
  payload: unknown;
  tick: number;
  createdAt: string;
}

export interface Alert {
  id: string;
  kind: string;
  message: string;
  agentId?: string;
  taskId?: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface TaskDetail {
  task: Task;
  decisions: DecisionRecord[];
  messages: Message[];
  diff?: string;
}

export type WsEvent =
  | { type: 'tick'; data: { tick: number } }
  | { type: 'message'; data: Message }
  | { type: 'task-status-changed'; data: { taskId: string; from: TaskStatus; to: TaskStatus } }
  | { type: 'agent-turn-end'; data: { agentId: string; tick: number; task?: Task } };
