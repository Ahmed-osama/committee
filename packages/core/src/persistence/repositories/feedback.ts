import { getLatestHumanRejectionFeedback } from './approval-repo.js';
import { getLatestReviewerFeedback } from './review-repo.js';

/**
 * A rejected task's feedback can come from a human (via `approvals`) or the
 * automated reviewer (via `review_verdicts`) — whichever one actually
 * caused the current `rejected` status. Compares timestamps rather than
 * assuming one source, since either a human or the reviewer can reject a
 * task at different points in its lifecycle.
 */
export function getLatestFeedback(taskId: string): string | undefined {
  const human = getLatestHumanRejectionFeedback(taskId);
  const reviewer = getLatestReviewerFeedback(taskId);
  if (!human) return reviewer?.note;
  if (!reviewer) return human.note;
  return new Date(human.at).getTime() >= new Date(reviewer.at).getTime() ? human.note : reviewer.note;
}
