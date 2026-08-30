import { tool } from 'ai';
import { z } from 'zod';
import type { ToolDefinition } from '../../domain/tool.js';
import type { GitWorkspace } from './git-workspace.js';
import { createInspectionTools } from './inspection-tools.js';

/**
 * The coder's entire menu of actions. Deliberately not a generic "run shell
 * command" tool — every action here is either read-only, confined to the
 * workspace root, or a fixed command with no model-supplied arguments
 * (runTests/runLint on the GitWorkspace).
 */
export function createDevShopTools(workspace: GitWorkspace): Record<string, ToolDefinition> {
  return {
    ...createInspectionTools(workspace, ['coder']),
    write_file: {
      name: 'write_file',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['coder'] },
      tool: tool({
        description: 'Overwrite (or create) a file in the workspace with the given content, relative to the workspace root.',
        inputSchema: z.object({
          path: z.string().describe('Path relative to the workspace root'),
          content: z.string().describe('The full new content of the file'),
        }),
        execute: ({ path, content }) => {
          try {
            workspace.writeFile(path, content);
            return `Wrote ${content.length} chars to ${path}`;
          } catch (err) {
            return `Error writing ${path}: ${(err as Error).message}`;
          }
        },
      }),
    },
    finish_task: {
      name: 'finish_task',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['coder'] },
      tool: tool({
        description:
          'Call this when you believe the task is complete and ready for review — after tests pass. Ends your turn.',
        inputSchema: z.object({ summary: z.string().describe('A short summary of what you changed and why') }),
        execute: ({ summary }) => `Marked done: ${summary}`,
      }),
    },
  };
}
