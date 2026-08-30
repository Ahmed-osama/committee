import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db.js';
import { reviewVerdicts } from '../schema.js';

export type ReviewVerdict = 'approve' | 'request_changes';

export function recordReviewVerdict(input: { taskId: string; agentId: string; verdict: ReviewVerdict; feedback?: string }): void {
  db.insert(reviewVerdicts)
    .values({ ...input, id: randomUUID(), createdAt: new Date().toISOString() })
    .run();
}

/** The reviewer's own feedback trail — kept separate from human rejection notes in `approvals`. */
export function getLatestReviewerFeedback(taskId: string): { note: string; at: string } | undefined {
  const row = db
    .select()
    .from(reviewVerdicts)
    .where(eq(reviewVerdicts.taskId, taskId))
    .orderBy(desc(reviewVerdicts.createdAt))
    .get();
  if (!row || row.verdict !== 'request_changes' || !row.feedback) return undefined;
  return { note: row.feedback, at: row.createdAt };
}
