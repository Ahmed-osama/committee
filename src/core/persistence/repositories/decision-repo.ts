import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { DecisionRecord } from '../../domain/run.js';
import { db } from '../db.js';
import { decisions } from '../schema.js';

export function recordDecision(input: Omit<DecisionRecord, 'id' | 'createdAt'>): void {
  db.insert(decisions)
    .values({ ...input, id: randomUUID(), createdAt: new Date().toISOString() })
    .run();
}

export function getDecisionsForTask(taskId: string): DecisionRecord[] {
  return db.select().from(decisions).where(eq(decisions.taskId, taskId)).all() as DecisionRecord[];
}
