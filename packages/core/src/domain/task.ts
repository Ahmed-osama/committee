export type TaskStatus =
  | 'pending'
  | 'claimed'
  | 'in_progress'
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

/**
 * The single source of truth for which status changes are legal.
 * There is no entry that lets `in_progress` (or anything else) reach
 * `done`/`approved` without passing through `awaiting_review` first —
 * that's the human-approval-before-ship invariant from the plan,
 * enforced here rather than by orchestrator convention.
 */
export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['claimed'],
  claimed: ['in_progress'],
  in_progress: ['awaiting_review'],
  awaiting_review: ['approved', 'rejected'],
  approved: ['done'],
  rejected: ['in_progress'],
  done: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from].includes(to);
}

export function transition(task: Task, to: TaskStatus, now: () => string = () => new Date().toISOString()): Task {
  if (!canTransition(task.status, to)) {
    throw new Error(`Illegal task transition: ${task.status} -> ${to}`);
  }
  return { ...task, status: to, updatedAt: now() };
}
