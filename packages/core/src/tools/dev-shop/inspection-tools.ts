import { tool } from 'ai';
import { z } from 'zod';
import type { ToolDefinition } from '../../domain/tool.js';
import type { GitWorkspace } from './git-workspace.js';

export const MAX_OUTPUT_CHARS = 8000;

export function truncate(text: string): string {
  return text.length > MAX_OUTPUT_CHARS ? text.slice(0, MAX_OUTPUT_CHARS) + '\n…(truncated)' : text;
}

/**
 * Read-only tools shared by every dev-shop role — a coder needs to read
 * before it writes, and a reviewer only ever reads. Kept in one place so
 * both roles see identical, already-tested behavior rather than two
 * near-duplicate copies drifting apart.
 */
export function createInspectionTools(workspace: GitWorkspace, allowedRoles: string[]): Record<string, ToolDefinition> {
  return {
    list_files: {
      name: 'list_files',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles },
      tool: tool({
        description: 'List tracked files in the workspace, so you know what exists before reading/editing.',
        inputSchema: z.object({}),
        execute: () => truncate(workspace.listFiles().join('\n')),
      }),
    },
    read_file: {
      name: 'read_file',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles },
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
    run_tests: {
      name: 'run_tests',
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles },
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
      metadata: { requiresApproval: false, costClass: 'free', allowedRoles },
      tool: tool({
        description: 'Run the workspace lint script (npm run lint), if one is configured. No arguments — the command is fixed.',
        inputSchema: z.object({}),
        execute: () => {
          const result = workspace.runLint();
          return `exit code: ${result.exitCode}\nstdout:\n${truncate(result.stdout)}\nstderr:\n${truncate(result.stderr)}`;
        },
      }),
    },
  };
}
