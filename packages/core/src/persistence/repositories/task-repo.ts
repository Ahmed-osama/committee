import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { canTransition, type Task, type TaskStatus } from '../../domain/task.js';
import { db } from '../db.js';
import { tasks } from '../schema.js';

export function createTask(input: {
  description: string;
  acceptanceCriteria: string;
  repoPath: string;
  baseBranch: string;
}): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    description: input.description,
    acceptanceCriteria: input.acceptanceCriteria,
    repoPath: input.repoPath,
    baseBranch: input.baseBranch,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(tasks).values(task).run();
  return task;
}

export function getTask(id: string): Task | undefined {
  const row = db.select().from(tasks).where(eq(tasks.id, id)).get();
  return row as Task | undefined;
}

export function saveTask(task: Task): void {
  db.update(tasks).set(task).where(eq(tasks.id, task.id)).run();
}

/** Moves a task to a new status, enforcing the same transition table as the pure domain function. */
export function transitionTask(id: string, to: TaskStatus, patch: Partial<Task> = {}): Task {
  const task = getTask(id);
  if (!task) throw new Error(`Task not found: ${id}`);
  if (!canTransition(task.status, to)) {
    throw new Error(`Illegal task transition: ${task.status} -> ${to}`);
  }
  const updated: Task = { ...task, ...patch, status: to, updatedAt: new Date().toISOString() };
  saveTask(updated);
  return updated;
}

/**
 * Hard ceiling on rejection/retry loops (a Non-Negotiable Safety Invariant
 * from the plan) — an agent that keeps failing review does not get infinite
 * attempts. Once hit, the task stays `rejected` for good; the human has to
 * create a fresh task if they want another attempt.
 */
export const MAX_RETRIES = 3;

export function retryTask(id: string): Task {
  const task = getTask(id);
  if (!task) throw new Error(`Task not found: ${id}`);
  if (task.retryCount >= MAX_RETRIES) {
    throw new Error(`Task ${id} hit the retry ceiling (${MAX_RETRIES}) and stays rejected — create a new task instead.`);
  }
  return transitionTask(id, 'in_progress', { retryCount: task.retryCount + 1 });
}
