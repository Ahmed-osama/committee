#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { resolve as resolvePath } from 'node:path';
import { Command } from 'commander';
import { generateText } from 'ai';
import {
  runAgentLoop,
  approve,
  reject,
  submitForReview,
  getOrCreateDefaultCoder,
  getLatestRejectionFeedback,
  recordDecision,
  getDecisionsForTask,
  createTask,
  getTask,
  retryTask,
  transitionTask,
  GitWorkspace,
  PROVIDER_REGISTRY,
  isProviderConfigured,
  getRateLimitStatus,
  getCallCountToday,
  getSpendUsdToday,
  saveTask,
  tryGetGitHubRemote,
  createPullRequest,
} from '@committee/core';

const program = new Command();

program.name('committee').description('AI agent employees — a Game-of-Life style multi-agent dev shop');

program
  .command('ping')
  .description('Smoke test: send a prompt straight to one provider/model and print the response')
  .argument('[prompt]', 'prompt to send', 'Reply with exactly one short sentence confirming you can hear me.')
  .option('-p, --provider <id>', 'provider id (ollama, groq, gemini, anthropic)', 'ollama')
  .option('-m, --model <model>', 'model id', 'llama3.1:8b')
  .action(async (prompt: string, opts: { provider: string; model: string }) => {
    const provider = PROVIDER_REGISTRY[opts.provider];
    if (!provider) throw new Error(`Unknown provider '${opts.provider}'. Known: ${Object.keys(PROVIDER_REGISTRY).join(', ')}`);
    const { text, usage } = await generateText({ model: provider.model(opts.model), prompt });
    console.log(text);
    console.log(`\n[tokens: ${usage.inputTokens} in / ${usage.outputTokens} out]`);
  });

program
  .command('providers')
  .description("Show the default coder agent's provider preference, config status, and today's rate-limit/spend usage")
  .action(() => {
    const agent = getOrCreateDefaultCoder();
    console.log(`Agent: ${agent.name} (${agent.id})`);
    console.log(`Calls today: ${getCallCountToday(agent.id)}`);
    console.log(`Spend today: $${getSpendUsdToday(agent.id).toFixed(4)}\n`);
    for (const providerId of agent.providerPreference) {
      const modelId = agent.modelByProvider[providerId];
      const configured = isProviderConfigured(providerId);
      if (!modelId) {
        console.log(`  ${providerId}: no model configured for this agent — skipped by the router`);
        continue;
      }
      if (!configured) {
        console.log(`  ${providerId} (${modelId}): not configured — missing API key`);
        continue;
      }
      const status = getRateLimitStatus(providerId, modelId);
      console.log(
        `  ${providerId} (${modelId}): ${status.availableNow ? 'available' : 'RATE-LIMITED'} — ` +
          `${status.rpmUsed}${status.rpmLimit !== undefined ? `/${status.rpmLimit}` : ''} rpm, ` +
          `${status.rpdUsed}${status.rpdLimit !== undefined ? `/${status.rpdLimit}` : ''} rpd`,
      );
    }
  });

function assertGitRepo(repoPath: string): void {
  try {
    execFileSync('git', ['-C', repoPath, 'rev-parse', '--is-inside-work-tree'], { stdio: 'pipe' });
  } catch {
    throw new Error(`${repoPath} is not a git repository`);
  }
}

async function runLoopAndReport(taskId: string, feedback?: string): Promise<void> {
  const task = getTask(taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  const agent = getOrCreateDefaultCoder();
  const workspace = task.workspacePath ? GitWorkspace.reattach(task) : GitWorkspace.create(task);

  if (!task.workspacePath) {
    transitionTask(taskId, 'claimed', { assignedAgentId: agent.id, workspacePath: workspace.path });
    transitionTask(taskId, 'in_progress');
  }

  console.log(`\nAgent working in ${workspace.path} (branch ${workspace.branch})...\n`);

  const result = await runAgentLoop({
    agent,
    task: getTask(taskId)!,
    workspace,
    feedback,
    onDecision: (d) => {
      recordDecision(d);
      if (d.kind === 'tool_call') {
        const detail = d.detail as { name: string; input: unknown };
        console.log(`  [tick ${d.tick}] tool_call: ${detail.name}(${JSON.stringify(detail.input)})`);
      }
    },
  });

  console.log(`\nprovider=${result.providerId} model=${result.modelId} finishReason=${result.finishReason} steps=${result.stepCount}`);

  if (result.finalSummary) {
    submitForReview(taskId);
    console.log(`\nAgent believes it's done: ${result.finalSummary}`);
    console.log(`Run: committee task review ${taskId}`);
  } else {
    console.log(`\nAgent did not call finish_task within its step budget — task remains in_progress.`);
    console.log(`Inspect ${workspace.path} manually, or extend --max-steps and re-run.`);
  }
}

const task = program.command('task').description('Manage dev-shop tasks');

task
  .command('create')
  .description('Create a task against a real git repo and have the default coder agent work it')
  .argument('<repoPath>', 'path to a git repository')
  .argument('<description>', 'what the agent should do')
  .requiredOption('--acceptance <criteria>', 'acceptance criteria for the task')
  .option('--branch <branch>', 'base branch to branch off of', 'main')
  .action(async (repoPath: string, description: string, opts: { acceptance: string; branch: string }) => {
    const absRepoPath = resolvePath(process.cwd(), repoPath);
    assertGitRepo(absRepoPath);
    const created = createTask({
      description,
      acceptanceCriteria: opts.acceptance,
      repoPath: absRepoPath,
      baseBranch: opts.branch,
    });
    console.log(`Created task ${created.id}`);
    await runLoopAndReport(created.id);
  });

task
  .command('review')
  .description('Show the diff + decision trail for a task awaiting review, and approve/reject it')
  .argument('<taskId>')
  .action(async (taskId: string) => {
    const t = getTask(taskId);
    if (!t) throw new Error(`Task not found: ${taskId}`);
    if (t.status !== 'awaiting_review') {
      console.log(`Task ${taskId} is '${t.status}', not awaiting_review — nothing to review yet.`);
      return;
    }
    const workspace = GitWorkspace.reattach(t);

    console.log(`\n--- decisions ---`);
    for (const d of getDecisionsForTask(taskId)) {
      console.log(`  [tick ${d.tick}] ${d.kind}: ${JSON.stringify(d.detail)}`);
    }
    console.log(`\n--- diff ---\n${workspace.diff() || '(no changes)'}`);

    // Independently re-run tests rather than trust the agent's self-reported
    // trail above — "never claim something works without having run it"
    // applies to this review step too, not just the agent's own instructions.
    const verified = workspace.runTests();
    console.log(`\n--- independently re-verified test run (exit code ${verified.exitCode}) ---`);
    console.log(verified.stdout || verified.stderr || '(no output)');
    if (verified.exitCode !== 0) {
      console.log(`\n⚠ Tests are NOT passing right now, regardless of what the agent claimed.`);
    }

    // Two sequential rl.question() calls are unreliable once stdin is a
    // piped (non-TTY) stream — the second call can hang forever because the
    // stream already hit EOF by the time it's registered. Reading through
    // the interface's own async iterator instead works for both a real
    // interactive terminal and piped/scripted input.
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    const lines = rl[Symbol.asyncIterator]();
    process.stdout.write('\nApprove or reject? [a/r]: ');
    const answer = ((await lines.next()).value ?? '').trim().toLowerCase();
    if (answer === 'a') {
      const commitResult = workspace.commit(`committee: ${t.description}`);
      if (commitResult.exitCode !== 0 && !commitResult.stdout.includes('nothing to commit')) {
        console.log(`Warning: commit reported exit code ${commitResult.exitCode}: ${commitResult.stderr}`);
      }
      approve(taskId);
      const done = transitionTask(taskId, 'done');

      const githubRemote = tryGetGitHubRemote(t.repoPath);
      if (githubRemote && process.env.GITHUB_TOKEN) {
        try {
          const pr = await createPullRequest({
            repoPath: t.repoPath,
            branch: workspace.branch,
            baseBranch: t.baseBranch,
            title: `committee: ${t.description}`,
            body: `${t.description}\n\nAcceptance criteria: ${t.acceptanceCriteria}`,
          });
          saveTask({ ...done, prUrl: pr.url });
          console.log(`Opened PR: ${pr.url}`);
        } catch (err) {
          console.log(`Warning: could not open a PR automatically (${(err as Error).message}).`);
          console.log(`The commit is still safe on branch ${workspace.branch} — push/PR it yourself.`);
        }
      } else {
        console.log(`Committed on branch ${workspace.branch} (no GitHub remote/token configured — local only).`);
      }
      workspace.removeWorktree();
      console.log(`Workspace cleaned up.`);
    } else {
      process.stdout.write('Rejection feedback for the agent: ');
      const note = (await lines.next()).value ?? '';
      reject(taskId, note);
      console.log(`Rejected. Run: committee task retry ${taskId}`);
    }
    rl.close();
  });

task
  .command('retry')
  .description('Re-run the agent on a rejected task, feeding back the reviewer note')
  .argument('<taskId>')
  .action(async (taskId: string) => {
    const feedback = getLatestRejectionFeedback(taskId);
    retryTask(taskId);
    await runLoopAndReport(taskId, feedback);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
