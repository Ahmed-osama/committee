import { execFileSync } from 'node:child_process';

export interface CreatePrInput {
  repoPath: string;
  branch: string;
  baseBranch: string;
  title: string;
  body: string;
}

export interface CreatePrResult {
  url: string;
  number: number;
}

/**
 * Supports the two shapes `git remote get-url origin` actually returns:
 * https://github.com/owner/repo(.git) and git@github.com:owner/repo(.git).
 */
export function parseGitHubRemote(remoteUrl: string): { owner: string; repo: string } | undefined {
  const patterns = [/^https:\/\/github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?\/?$/, /^git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/];
  for (const pattern of patterns) {
    const match = remoteUrl.trim().match(pattern);
    if (match) return { owner: match[1], repo: match[2] };
  }
  return undefined;
}

/** Returns undefined (never throws) when the repo has no GitHub-shaped origin remote — that's the normal case for a local-only toy/test repo. */
export function tryGetGitHubRemote(repoPath: string): { owner: string; repo: string } | undefined {
  try {
    const remoteUrl = execFileSync('git', ['-C', repoPath, 'remote', 'get-url', 'origin'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return parseGitHubRemote(remoteUrl);
  } catch {
    return undefined;
  }
}

export async function createPullRequest(input: CreatePrInput): Promise<CreatePrResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');

  const remote = tryGetGitHubRemote(input.repoPath);
  if (!remote) throw new Error(`${input.repoPath}'s origin remote is not a recognizable GitHub URL`);

  // Push from repoPath, not the worktree — branches live in the shared
  // object store, so this works whether or not the worktree still exists.
  execFileSync('git', ['-C', input.repoPath, 'push', 'origin', `${input.branch}:${input.branch}`], { stdio: 'pipe' });

  const res = await fetch(`https://api.github.com/repos/${remote.owner}/${remote.repo}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: input.title, body: input.body, head: input.branch, base: input.baseBranch }),
  });

  if (!res.ok) {
    throw new Error(`GitHub PR creation failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { html_url: string; number: number };
  return { url: data.html_url, number: data.number };
}
