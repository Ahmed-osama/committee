import { exec } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';

const execAsync = promisify(exec);

// Overridable so tests / alternate deployments aren't stuck acting on
// whatever directory the server happened to be launched from.
const REPO_ROOT = process.env.COMMITTEE_REPO_ROOT ?? process.cwd();
const MAX_OUTPUT_CHARS = 8_000;
const COMMAND_TIMEOUT_MS = 120_000;

function truncate(text: string): string {
  return text.length > MAX_OUTPUT_CHARS ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n… (truncated)` : text;
}

/** Keeps read_file/write_file inside the repo — run_command is a full shell and isn't sandboxed the same way. */
function resolveInRepo(relativePath: string): string {
  const resolved = resolve(REPO_ROOT, relativePath);
  if (resolved !== REPO_ROOT && !resolved.startsWith(REPO_ROOT + sep)) {
    throw new Error(`Refusing to access a path outside the repo: ${relativePath}`);
  }
  return resolved;
}

/**
 * The real tools an execution turn gets after a plan is finalized — the
 * same kind of shell/file access a coding agent uses, scoped to this repo.
 * There is no command allowlist: the human explicitly asked for this turn
 * to act on the codebase, so the trust boundary is "the human typed this
 * command", the same as running it themselves in a terminal here.
 */
export const executionTools: ToolSet = {
  run_command: tool({
    description: `Run a shell command in the repo at ${REPO_ROOT}. Use it for builds, tests, git, formatting, listing files, etc.`,
    inputSchema: z.object({ command: z.string() }),
    execute: async ({ command }) => {
      try {
        const { stdout, stderr } = await execAsync(command, { cwd: REPO_ROOT, timeout: COMMAND_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 });
        return truncate(stdout + (stderr ? `\n[stderr]\n${stderr}` : '')) || '(no output)';
      } catch (err) {
        const e = err as { stdout?: string; stderr?: string; message?: string };
        return truncate(`command failed: ${e.message ?? String(err)}\n${e.stdout ?? ''}\n${e.stderr ?? ''}`);
      }
    },
  }),
  read_file: tool({
    description: 'Read a text file from the repo, given a path relative to the repo root.',
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      try {
        return truncate(await readFile(resolveInRepo(path), 'utf8'));
      } catch (err) {
        return `error reading ${path}: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  }),
  write_file: tool({
    description: 'Create or overwrite a text file in the repo, given a path relative to the repo root. Creates parent directories as needed.',
    inputSchema: z.object({ path: z.string(), content: z.string() }),
    execute: async ({ path, content }) => {
      try {
        const absolute = resolveInRepo(path);
        await mkdir(dirname(absolute), { recursive: true });
        await writeFile(absolute, content, 'utf8');
        return `wrote ${path} (${content.length} bytes)`;
      } catch (err) {
        return `error writing ${path}: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  }),
};
