#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { Command } from 'commander';
import { generateText } from 'ai';
import {
  runAgentLoop,
  approveTask,
  rejectTask,
  getOrCreateDefaultCoder,
  getOrCreateDefaultReviewer,
  getLatestFeedback,
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
  advanceTicks,
  getAllMessages,
  getCurrentTick,
  pauseScheduler,
  resumeScheduler,
  isPaused,
  getUnacknowledgedAlerts,
  EventBus,
  startDashboardServer,
} from '@committee/core';
import type { DashboardServerHandle } from '@committee/core';

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
    transitionTask(taskId, 'pending_auto_review');
    console.log(`\nAgent believes it's done: ${result.finalSummary}`);
    console.log(`Run: committee tick advance 1   (lets the reviewer agent look at it before it reaches you)`);
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
      const hint = t.status === 'pending_auto_review' ? " — run 'committee tick advance 1' to let the reviewer look at it first" : '';
      console.log(`Task ${taskId} is '${t.status}', not awaiting_review — nothing to review yet${hint}.`);
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
      const result = await approveTask(taskId);
      if (result.commitWarning) console.log(`Warning: ${result.commitWarning}`);
      if (result.prUrl) {
        console.log(`Opened PR: ${result.prUrl}`);
      } else {
        console.log(`Committed on branch ${result.branch} (no GitHub remote/token configured, or PR creation failed — local only).`);
      }
      console.log(`Workspace cleaned up.`);
    } else {
      process.stdout.write('Rejection feedback for the agent: ');
      const note = (await lines.next()).value ?? '';
      rejectTask(taskId, note);
      console.log(`Rejected. Run: committee task retry ${taskId}`);
    }
    rl.close();
  });

task
  .command('retry')
  .description('Re-run the agent on a rejected task, feeding back the reviewer note')
  .argument('<taskId>')
  .action(async (taskId: string) => {
    const feedback = getLatestFeedback(taskId);
    retryTask(taskId);
    await runLoopAndReport(taskId, feedback);
  });

program
  .command('tick')
  .description('Advance the scheduler — every agent gets a chance to react to whatever needs its attention')
  .argument('<count>', 'number of ticks to advance', (v) => parseInt(v, 10))
  .action(async (count: number) => {
    const coder = getOrCreateDefaultCoder();
    const reviewer = getOrCreateDefaultReviewer();
    await advanceTicks(count, {
      agents: [coder, reviewer],
      onTick: (tick, outcomes) => {
        console.log(`\n--- tick ${tick} ---`);
        for (const outcome of outcomes) {
          if (outcome.action === 'idle') {
            console.log(`  ${outcome.agentId}: idle (nothing needs its attention)`);
          } else {
            console.log(`  ${outcome.agentId}: ${outcome.action} on task ${outcome.taskId} — ${outcome.detail}`);
          }
        }
      },
    });
    console.log(`\nNow at tick ${getCurrentTick()}. Run 'committee task review <id>' for anything awaiting_review.`);
  });

program
  .command('messages')
  .description('Inspect the inter-agent message log (the neighbor-interaction record)')
  .option('--since <tick>', 'only show messages after this tick', (v) => parseInt(v, 10), -1)
  .action((opts: { since: number }) => {
    for (const m of getAllMessages(opts.since)) {
      const to = m.toAgentId ?? '(broadcast)';
      console.log(`[tick ${m.tick}] ${m.fromAgentId} -> ${to} (${m.intent}): ${JSON.stringify(m.payload)}`);
    }
  });

const PID_FILE = join(homedir(), '.committee', 'daemon.pid');

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readDaemonPid(): number | undefined {
  if (!existsSync(PID_FILE)) return undefined;
  const pid = parseInt(readFileSync(PID_FILE, 'utf-8'), 10);
  if (isProcessAlive(pid)) return pid;
  unlinkSync(PID_FILE); // stale pid file from a process that didn't shut down cleanly (e.g. kill -9)
  return undefined;
}

const daemon = program
  .command('daemon')
  .description('Long-running autonomous mode — advances ticks on an interval without a human driving each one');

daemon
  .command('run')
  .description('Run in the foreground: advance one tick every --interval seconds until stopped')
  .option('--interval <seconds>', 'seconds between ticks', (v) => parseInt(v, 10), 30)
  .option('--web-port <port>', 'also serve the dashboard API/WebSocket on this port', (v) => parseInt(v, 10))
  .action(async (opts: { interval: number; webPort?: number }) => {
    const existingPid = readDaemonPid();
    if (existingPid) {
      console.error(`Daemon already running (pid ${existingPid}). Run 'committee daemon stop' first.`);
      process.exit(1);
    }
    mkdirSync(dirname(PID_FILE), { recursive: true });
    writeFileSync(PID_FILE, String(process.pid));

    // A soft-stop flag, not a hard kill: SIGINT/SIGTERM let the tick
    // currently in flight finish (including any in-progress LLM call)
    // before exiting, rather than aborting mid-write. The hard kill switch
    // is `committee daemon pause`, checked every tick via isPaused() —
    // that's what stops NEW work from starting, from any process, not just
    // this one's own signal handlers.
    let stopRequested = false;
    const requestStop = () => {
      console.log('\nShutdown requested — finishing the current tick, then exiting.');
      stopRequested = true;
    };
    process.on('SIGINT', requestStop);
    process.on('SIGTERM', requestStop);

    console.log(`Daemon started (pid ${process.pid}), interval ${opts.interval}s.`);
    console.log(`Stop it with Ctrl+C here, or 'committee daemon stop' from another terminal.`);

    const coder = getOrCreateDefaultCoder();
    const reviewer = getOrCreateDefaultReviewer();

    // One EventBus instance for the whole run, shared with the dashboard
    // server below — that sharing is *why* the dashboard has to live in
    // this same process: events are in-process only, so a separate
    // process would see nothing live off a different EventBus instance.
    const bus = new EventBus();
    let dashboard: DashboardServerHandle | undefined;
    if (opts.webPort) {
      dashboard = startDashboardServer({ bus, agents: [coder, reviewer], port: opts.webPort });
      console.log(`Dashboard API/WebSocket listening on http://localhost:${opts.webPort}`);
    }

    try {
      while (!stopRequested) {
        if (isPaused()) {
          console.log(`[${new Date().toISOString()}] paused — run 'committee daemon resume' to continue.`);
        } else {
          await advanceTicks(1, {
            agents: [coder, reviewer],
            bus,
            onTick: (tick, outcomes) => {
              for (const outcome of outcomes) {
                if (outcome.action === 'idle') continue;
                console.log(`[tick ${tick}] ${outcome.agentId}: ${outcome.action} ${outcome.taskId ?? ''} — ${outcome.detail}`);
              }
            },
          });
          const alerts = getUnacknowledgedAlerts();
          if (alerts.length > 0) {
            console.log(`⚠ ${alerts.length} unacknowledged alert(s) — run 'committee daemon status' to see them.`);
          }
        }
        if (stopRequested) break;
        await sleep(opts.interval * 1000);
      }
    } finally {
      if (dashboard) await dashboard.close();
      if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    }
    console.log('Daemon stopped cleanly.');
  });

daemon
  .command('pause')
  .description('Kill switch: no new ticks advance (from any process) until resumed')
  .action(() => {
    pauseScheduler();
    console.log("Scheduler paused. Run 'committee daemon resume' to continue.");
  });

daemon
  .command('resume')
  .description('Undo a pause')
  .action(() => {
    resumeScheduler();
    console.log('Scheduler resumed.');
  });

daemon
  .command('stop')
  .description('Send a graceful shutdown signal to the running daemon process')
  .action(() => {
    const pid = readDaemonPid();
    if (!pid) {
      console.log('No daemon appears to be running.');
      return;
    }
    process.kill(pid, 'SIGTERM');
    console.log(`Sent shutdown signal to daemon (pid ${pid}) — it will finish its current tick and exit.`);
  });

daemon
  .command('status')
  .description('Whether the daemon is running, paused, and any unacknowledged alerts')
  .action(() => {
    const pid = readDaemonPid();
    console.log(`Daemon process: ${pid ? `running (pid ${pid})` : 'not running'}`);
    console.log(`Paused: ${isPaused()}`);
    console.log(`Current tick: ${getCurrentTick()}`);
    const alerts = getUnacknowledgedAlerts();
    console.log(`Unacknowledged alerts: ${alerts.length}`);
    for (const a of alerts) {
      console.log(`  [${a.kind}] ${a.message}${a.taskId ? ` (task ${a.taskId})` : ''}`);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
