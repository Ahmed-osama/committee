import { approve, reject } from './approval-gate.js';
import { getTask, saveTask, transitionTask, alertIfRetriesExhausted } from '../persistence/repositories/task-repo.js';
import { createPullRequest, tryGetGitHubRemote } from '../tools/dev-shop/create-pr.js';
import { GitWorkspace } from '../tools/dev-shop/git-workspace.js';

export interface ApproveTaskResult {
  branch: string;
  prUrl?: string;
  commitWarning?: string;
}

/**
 * The one place "approve a task" actually happens — commit, optionally
 * open a PR, clean up the workspace. Both the CLI's `task review` and the
 * dashboard's approve button call this, so there's exactly one place that
 * can ship a task, not two copies that could quietly drift apart.
 */
export async function approveTask(taskId: string): Promise<ApproveTaskResult> {
  const task = getTask(taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  if (task.status !== 'awaiting_review') {
    throw new Error(`Task ${taskId} is '${task.status}', not awaiting_review — nothing to approve yet.`);
  }

  const workspace = GitWorkspace.reattach(task);
  const commitResult = workspace.commit(`committee: ${task.description}`);
  const commitWarning =
    commitResult.exitCode !== 0 && !commitResult.stdout.includes('nothing to commit')
      ? `commit reported exit code ${commitResult.exitCode}: ${commitResult.stderr}`
      : undefined;

  approve(taskId);
  const done = transitionTask(taskId, 'done');

  let prUrl: string | undefined;
  const githubRemote = tryGetGitHubRemote(task.repoPath);
  if (githubRemote && process.env.GITHUB_TOKEN) {
    try {
      const pr = await createPullRequest({
        repoPath: task.repoPath,
        branch: workspace.branch,
        baseBranch: task.baseBranch,
        title: `committee: ${task.description}`,
        body: `${task.description}\n\nAcceptance criteria: ${task.acceptanceCriteria}`,
      });
      saveTask({ ...done, prUrl: pr.url });
      prUrl = pr.url;
    } catch {
      // Not fatal — the commit is already safe on the branch either way.
    }
  }

  workspace.removeWorktree();
  return { branch: workspace.branch, prUrl, commitWarning };
}

export function rejectTask(taskId: string, feedback: string): void {
  const task = getTask(taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  reject(taskId, feedback);
  alertIfRetriesExhausted(task);
}
