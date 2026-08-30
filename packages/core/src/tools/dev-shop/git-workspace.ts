import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { Task } from '../../domain/task.js';

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

// Deliberately outside any target repo — a workspace is our own runtime
// data, never something a target repo's .gitignore/tooling has to know about.
const WORKSPACE_ROOT = join(homedir(), '.committee', 'workspaces');
const COMMAND_TIMEOUT_MS = 120_000;

function branchNameFor(taskId: string): string {
  return `committee/task-${taskId}`;
}

/**
 * The isolation boundary between agents and real repos. An agent never gets
 * raw shell access — every file operation is path-checked against the
 * workspace root, and the only commands it can trigger are the fixed,
 * argument-free runTests()/runLint() below (never an arbitrary string the
 * model constructs).
 */
export class GitWorkspace {
  private constructor(
    private readonly task: Task,
    readonly path: string,
    readonly branch: string,
  ) {}

  static create(task: Task): GitWorkspace {
    const path = join(WORKSPACE_ROOT, task.id);
    const branch = branchNameFor(task.id);
    mkdirSync(WORKSPACE_ROOT, { recursive: true });
    execFileSync('git', ['-C', task.repoPath, 'worktree', 'add', path, '-b', branch, task.baseBranch], {
      stdio: 'pipe',
    });
    return new GitWorkspace(task, path, branch);
  }

  /** Re-open a workspace that was already created in an earlier CLI invocation (e.g. for `task review`/`task retry`). */
  static reattach(task: Task): GitWorkspace {
    if (!task.workspacePath) throw new Error(`Task ${task.id} has no workspace to reattach to`);
    return new GitWorkspace(task, task.workspacePath, branchNameFor(task.id));
  }

  private resolvePath(relPath: string): string {
    const resolved = resolve(this.path, relPath);
    if (resolved !== this.path && !resolved.startsWith(this.path + '/')) {
      throw new Error(`Refusing to access path outside workspace: ${relPath}`);
    }
    return resolved;
  }

  readFile(relPath: string): string {
    return readFileSync(this.resolvePath(relPath), 'utf-8');
  }

  writeFile(relPath: string, content: string): void {
    const abs = this.resolvePath(relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
  }

  listFiles(maxEntries = 400): string[] {
    const out = this.run('git', ['ls-files']);
    return out.stdout.split('\n').filter(Boolean).slice(0, maxEntries);
  }

  private run(cmd: string, args: string[]): CommandResult {
    try {
      const stdout = execFileSync(cmd, args, {
        cwd: this.path,
        timeout: COMMAND_TIMEOUT_MS,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { exitCode: 0, stdout, stderr: '' };
    } catch (err) {
      const e = err as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string; message?: string };
      return {
        exitCode: typeof e.status === 'number' ? e.status : 1,
        stdout: e.stdout?.toString() ?? '',
        stderr: e.stderr?.toString() ?? String(e.message ?? err),
      };
    }
  }

  /** Fixed command, no model-supplied arguments — this is the safety property, not an implementation detail. */
  runTests(): CommandResult {
    return this.run('npm', ['test', '--silent']);
  }

  runLint(): CommandResult {
    const pkgPath = join(this.path, 'package.json');
    if (!existsSync(pkgPath)) return { exitCode: 0, stdout: 'no package.json — skipping lint', stderr: '' };
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, string> };
    if (!pkg.scripts?.lint) return { exitCode: 0, stdout: 'no lint script configured — skipping', stderr: '' };
    return this.run('npm', ['run', 'lint', '--silent']);
  }

  diff(): string {
    return this.run('git', ['diff']).stdout;
  }

  commit(message: string): CommandResult {
    this.run('git', ['add', '-A']);
    return this.run('git', ['commit', '-m', message]);
  }

  /**
   * Removes the linked working directory only — never the branch. This is
   * the one to call after an *approved* task: the branch (and whatever got
   * committed to it) is the actual deliverable and must survive workspace
   * cleanup. A prior version of this method deleted the branch too, which
   * destroyed a just-approved commit the moment it was made — caught by
   * actually inspecting the target repo after a real approve, not by any
   * test, since the bug only shows up by checking git history afterward.
   */
  removeWorktree(): void {
    execFileSync('git', ['-C', this.task.repoPath, 'worktree', 'remove', this.path, '--force'], { stdio: 'pipe' });
  }

  /** Only for genuinely abandoning a task's work — removes the worktree and deletes its branch. */
  discardEntirely(): void {
    this.removeWorktree();
    try {
      execFileSync('git', ['-C', this.task.repoPath, 'branch', '-D', this.branch], { stdio: 'pipe' });
    } catch {
      // No commits were ever made on the branch — nothing to delete, that's fine.
    }
  }
}
