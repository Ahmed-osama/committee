import { tool } from 'ai';
import { z } from 'zod';
import type { ToolDefinition } from '../../domain/tool.js';
import type { GitWorkspace } from './git-workspace.js';
import { createInspectionTools } from './inspection-tools.js';

/**
 * The reviewer's menu — read-only inspection plus exactly two ways to end
 * its turn, neither of which is "finish_task": a reviewer never finishes
 * the work, it only forwards or bounces back what the coder produced.
 */
export function createReviewTools(workspace: GitWorkspace): Record<string, ToolDefinition> {
  return {
    ...createInspectionTools(workspace, ['reviewer']),
    approve_for_human: {
      name: 'approve_for_human',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['reviewer'] },
      tool: tool({
        description:
          'Call this once you have independently confirmed the diff looks correct and tests actually pass. ' +
          'This does NOT ship anything — it only forwards the task to a human for final sign-off.',
        inputSchema: z.object({ note: z.string().describe('Why you think this is ready for human review') }),
        execute: ({ note }) => `Forwarded to human review: ${note}`,
      }),
    },
    request_changes: {
      name: 'request_changes',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['reviewer'] },
      tool: tool({
        description: 'Call this if you found a real problem — the coder will see your feedback and retry automatically.',
        inputSchema: z.object({ feedback: z.string().describe('Specific, actionable feedback for the coder') }),
        execute: ({ feedback }) => `Sent back to coder: ${feedback}`,
      }),
    },
  };
}
