import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNull, lt } from 'drizzle-orm';
import { canTransition, type Task, type TaskStatus } from '../../domain/task.js';
import { db } from '../db.js';
import { tasks } from '../schema.js';
import { recordAlert } from './alert-repo.js';

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

export function getAllTasks(): Task[] {
  return db.select().from(tasks).orderBy(tasks.createdAt).all() as Task[];
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

/**
 * Call right after rejecting a task (human or reviewer). Once retryCount is
 * already at the ceiling, findNextCoderTask's query excludes it forever —
 * it would just silently stop being worked on with no one ever told, which
 * is exactly the failure mode an unattended daemon needs an alert for.
 */
export function alertIfRetriesExhausted(task: Task): void {
  if (task.retryCount >= MAX_RETRIES) {
    recordAlert({
      kind: 'retries_exhausted',
      message: `Task ${task.id} exhausted its retry ceiling (${MAX_RETRIES}) and will not be auto-retried. Needs human attention.`,
      taskId: task.id,
    });
  }
}

/**
 * What a coder agent is "due" to act on this tick: a task it's already
 * mid-flight on, or one that just got bounced back (by a human or the
 * reviewer) with retries still available — auto-retrying a rejection is
 * exactly the "keeps reacting without a human prompt" behavior ticks exist
 * for. Oldest first, one task per turn — a cell reacts once per generation.
 */
export function findNextCoderTask(agentId: string): Task | undefined {
  const active = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.assignedAgentId, agentId), inArray(tasks.status, ['claimed', 'in_progress'])))
    .orderBy(tasks.updatedAt)
    .get() as Task | undefined;
  if (active) return active;

  const retriable = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.assignedAgentId, agentId), eq(tasks.status, 'rejected'), lt(tasks.retryCount, MAX_RETRIES)))
    .orderBy(tasks.updatedAt)
    .get() as Task | undefined;
  if (retriable) return retriable;

  // Freshly created tasks have no assignedAgentId yet — this is how an
  // unclaimed task actually gets picked up by tick-driven scheduling
  // instead of only ever working via the explicit `task create` CLI flow.
  return db
    .select()
    .from(tasks)
    .where(and(isNull(tasks.assignedAgentId), eq(tasks.status, 'pending')))
    .orderBy(tasks.createdAt)
    .get() as Task | undefined;
}

/** The reviewer's inbox — oldest task waiting for an automated pass, regardless of which coder produced it. */
export function findNextReviewTask(): Task | undefined {
  return db.select().from(tasks).where(eq(tasks.status, 'pending_auto_review')).orderBy(tasks.updatedAt).get() as
    | Task
    | undefined;
}
