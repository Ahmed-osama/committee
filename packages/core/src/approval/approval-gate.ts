import type { Task } from '../domain/task.js';
import { requestApproval, resolveApproval } from '../persistence/repositories/approval-repo.js';
import { transitionTask } from '../persistence/repositories/task-repo.js';

/** The human-in-the-loop checkpoint: nothing here can skip straight to `approved`/`done`. */
export function submitForReview(taskId: string): Task {
  const task = transitionTask(taskId, 'awaiting_review');
  requestApproval(taskId);
  return task;
}

export function approve(taskId: string): Task {
  resolveApproval(taskId, 'approved');
  return transitionTask(taskId, 'approved');
}

export function reject(taskId: string, note: string): Task {
  resolveApproval(taskId, 'rejected', note);
  return transitionTask(taskId, 'rejected');
}
