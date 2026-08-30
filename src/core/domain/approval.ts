export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  taskId: string;
  status: ApprovalStatus;
  reviewNote?: string;
  createdAt: string;
  resolvedAt?: string;
}
