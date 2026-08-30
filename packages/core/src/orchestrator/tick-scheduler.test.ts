import assert from 'node:assert/strict';
import { test } from 'node:test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { AgentConfig } from '../domain/agent.js';
import { db } from '../persistence/db.js';
import { getUnacknowledgedAlerts } from '../persistence/repositories/alert-repo.js';
import { pauseScheduler, resumeScheduler } from '../persistence/repositories/scheduler-repo.js';
import { createTask } from '../persistence/repositories/task-repo.js';
import { advanceTicks } from './tick-scheduler.js';

test.before(() => {
  migrate(db, { migrationsFolder: './drizzle' });
});

function fakeAgent(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    id: `agent-${Math.random().toString(36).slice(2)}`,
    name: 'Test Agent',
    role: 'coder',
    systemPrompt: 'x',
    providerPreference: [],
    modelByProvider: {},
    toolAllowList: [],
    ...overrides,
  };
}

test('the kill switch: a paused scheduler advances zero ticks and reports it', async () => {
  pauseScheduler();
  let pausedCalled = false;
  const completed = await advanceTicks(3, { agents: [], onPaused: () => (pausedCalled = true) });
  assert.equal(completed, 0);
  assert.equal(pausedCalled, true);
  resumeScheduler();
});

test('resuming lets ticks advance again', async () => {
  resumeScheduler();
  const completed = await advanceTicks(2, { agents: [] });
  assert.equal(completed, 2);
});

test('one agent throwing does not crash the whole tick — the others still get their turn, and it is recorded as an alert', async () => {
  // No provider configured at all — selectProvider throws synchronously,
  // before ever reaching the network, so this is fully deterministic.
  const broken = fakeAgent({ id: 'broken-agent' });
  const healthy = fakeAgent({ id: 'healthy-agent', role: 'triage' as AgentConfig['role'] }); // no task-taking role -> always idle, never calls an LLM

  const task = createTask({ description: 'x', acceptanceCriteria: 'x', repoPath: '/tmp/x', baseBranch: 'main' });
  // Not assigned to anyone, status 'pending' — findNextCoderTask picks it up for the broken agent.
  void task;

  let outcomes: Array<{ agentId: string; action: string }> = [];
  const completed = await advanceTicks(1, {
    agents: [broken, healthy],
    onTick: (_tick, o) => {
      outcomes = o;
    },
  });

  assert.equal(completed, 1, 'the tick as a whole still completes despite one agent erroring');
  const brokenOutcome = outcomes.find((o) => o.agentId === 'broken-agent');
  const healthyOutcome = outcomes.find((o) => o.agentId === 'healthy-agent');
  assert.equal(brokenOutcome?.action, 'error');
  assert.equal(healthyOutcome?.action, 'idle', "the healthy agent's turn was not skipped because of the other one's error");

  const alerts = getUnacknowledgedAlerts();
  assert.ok(alerts.some((a) => a.agentId === 'broken-agent'), 'the error was recorded as an alert, not just swallowed');
});
