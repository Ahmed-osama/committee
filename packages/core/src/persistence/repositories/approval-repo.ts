import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import type { Approval, ApprovalStatus } from '../../domain/approval.js';
import { db } from '../db.js';
import { approvals } from '../schema.js';

export function requestApproval(taskId: string): Approval {
  const approval: Approval = { id: randomUUID(), taskId, status: 'pending', createdAt: new Date().toISOString() };
  db.insert(approvals).values(approval).run();
  return approval;
}

export function resolveApproval(taskId: string, status: Exclude<ApprovalStatus, 'pending'>, reviewNote?: string): void {
  const pending = db
    .select()
    .from(approvals)
    .where(eq(approvals.taskId, taskId))
    .orderBy(desc(approvals.createdAt))
    .get() as Approval | undefined;
  if (!pending) throw new Error(`No approval record found for task ${taskId}`);
  db.update(approvals)
    .set({ status, reviewNote, resolvedAt: new Date().toISOString() })
    .where(eq(approvals.id, pending.id))
    .run();
}

export function getLatestRejectionFeedback(taskId: string): string | undefined {
  const row = db
    .select()
    .from(approvals)
    .where(eq(approvals.taskId, taskId))
    .orderBy(desc(approvals.createdAt))
    .get() as Approval | undefined;
  return row?.status === 'rejected' ? row.reviewNote : undefined;
}
