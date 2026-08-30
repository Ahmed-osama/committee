import assert from 'node:assert/strict';
import { test } from 'node:test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { AgentConfig } from '../domain/agent.js';
import { db } from '../persistence/db.js';
import { recordProviderCall } from './rate-limit-tracker.js';

// The router reads its ceiling constants from env vars once, at
// module-load time. This file exists purely to set tiny ceilings *before*
// importing the module for the first time (top-level await + dynamic
// import runs after this assignment; a static top-level import would not,
// since import declarations are hoisted above ordinary statements) — kept
// in its own file so it never affects provider-router.test.ts, which needs
// the real default ceilings.
process.env.COMMITTEE_DAILY_CALL_CEILING = '2';
process.env.COMMITTEE_DAILY_SPEND_USD_CEILING = '0.01';
const { selectProvider } = await import('./provider-router.js');

test.before(() => {
  migrate(db, { migrationsFolder: './drizzle' });
});

function fakeAgent(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    id: `agent-${Math.random().toString(36).slice(2)}`,
    name: 'Test Agent',
    role: 'coder',
    systemPrompt: 'x',
    providerPreference: ['ollama'],
    modelByProvider: { ollama: 'llama3.1:8b' },
    toolAllowList: [],
    ...overrides,
  };
}

test('hard-stops once the daily call ceiling is hit, even with a healthy provider available', () => {
  const agent = fakeAgent();
  recordProviderCall({ agentId: agent.id, providerId: 'ollama', modelId: 'llama3.1:8b', inputTokens: 1, outputTokens: 1, costUsd: 0 });
  recordProviderCall({ agentId: agent.id, providerId: 'ollama', modelId: 'llama3.1:8b', inputTokens: 1, outputTokens: 1, costUsd: 0 });

  assert.throws(() => selectProvider(agent), /daily call ceiling/);
});

test('hard-stops once the daily spend ceiling is hit', () => {
  const agent = fakeAgent({ providerPreference: ['anthropic'], modelByProvider: { anthropic: 'claude-sonnet-5' } });
  recordProviderCall({ agentId: agent.id, providerId: 'anthropic', modelId: 'claude-sonnet-5', inputTokens: 0, outputTokens: 0, costUsd: 0.02 });

  assert.throws(() => selectProvider(agent), /daily spend ceiling/);
});
