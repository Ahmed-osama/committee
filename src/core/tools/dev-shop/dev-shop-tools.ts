import { tool } from 'ai';
import { z } from 'zod';
import type { ToolDefinition } from '../../domain/tool.js';
import type { GitWorkspace } from './git-workspace.js';

const MAX_OUTPUT_CHARS = 8000;

function truncate(text: string): string {
  return text.length > MAX_OUTPUT_CHARS ? text.slice(0, MAX_OUTPUT_CHARS) + '\n…(truncated)' : text;
}

/**
 * The agent's entire menu of actions for a dev-shop task. Deliberately not a
 * generic "run shell command" tool — every action here is either read-only,
 * confined to the workspace root, or a fixed command with no model-supplied
 * arguments (runTests/runLint on the GitWorkspace).
 */
export function createDevShopTools(workspace: GitWorkspace): Record<string, ToolDefinition> {
  return {
    list_files: {
      name: 'list_files',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['coder'] },
      tool: tool({
        description: 'List tracked files in the workspace, so you know what exists before reading/editing.',
        inputSchema: z.object({}),
        execute: () => truncate(workspace.listFiles().join('\n')),
      }),
    },
    read_file: {
      name: 'read_file',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['coder'] },
      tool: tool({
        description: 'Read a text file from the workspace, given a path relative to the workspace root.',
        inputSchema: z.object({ path: z.string().describe('Path relative to the workspace root') }),
        execute: ({ path }) => {
          try {
            return truncate(workspace.readFile(path));
          } catch (err) {
            return `Error reading ${path}: ${(err as Error).message}`;
          }
        },
      }),
    },
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
    run_tests: {
      name: 'run_tests',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['coder'] },
      tool: tool({
        description: "Run the workspace's test suite (npm test) and report the result. No arguments — the command is fixed.",
        inputSchema: z.object({}),
        execute: () => {
          const result = workspace.runTests();
          return `exit code: ${result.exitCode}\nstdout:\n${truncate(result.stdout)}\nstderr:\n${truncate(result.stderr)}`;
        },
      }),
    },
    run_lint: {
      name: 'run_lint',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['coder'] },
      tool: tool({
        description: 'Run the workspace lint script (npm run lint), if one is configured. No arguments — the command is fixed.',
        inputSchema: z.object({}),
        execute: () => {
          const result = workspace.runLint();
          return `exit code: ${result.exitCode}\nstdout:\n${truncate(result.stdout)}\nstderr:\n${truncate(result.stderr)}`;
        },
      }),
    },
    finish_task: {
      name: 'finish_task',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles: ['coder'] },
      tool: tool({
        description:
          'Call this when you believe the task is complete and ready for human review — after tests pass. Ends your turn.',
        inputSchema: z.object({ summary: z.string().describe('A short summary of what you changed and why') }),
        execute: ({ summary }) => `Marked done: ${summary}`,
      }),
    },
  };
}
