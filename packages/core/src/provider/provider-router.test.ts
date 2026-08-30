import assert from 'node:assert/strict';
import { test } from 'node:test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { AgentConfig } from '../domain/agent.js';
import { db } from '../persistence/db.js';
import { recordProviderCall } from './rate-limit-tracker.js';
import { selectProvider } from './provider-router.js';

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

test('falls through an unconfigured provider (missing API key) to the next one', () => {
  delete process.env.GROQ_API_KEY;
  const agent = fakeAgent({
    providerPreference: ['groq', 'ollama'],
    modelByProvider: { groq: 'llama-3.3-70b-versatile', ollama: 'llama3.1:8b' },
  });
  const selection = selectProvider(agent);
  assert.deepEqual(selection, { providerId: 'ollama', modelId: 'llama3.1:8b' });
});

test('falls through a rate-limited provider to the next one', () => {
  process.env.GROQ_API_KEY = 'fake-key-for-config-check-only';
  const agent = fakeAgent({
    providerPreference: ['groq', 'ollama'],
    modelByProvider: { groq: 'saturate-me', ollama: 'llama3.1:8b' },
  });

  // groq's default limit is 30 rpm — saturate it for this exact model id.
  for (let i = 0; i < 30; i++) {
    recordProviderCall({ agentId: agent.id, providerId: 'groq', modelId: 'saturate-me', inputTokens: 1, outputTokens: 1, costUsd: 0 });
  }

  const selection = selectProvider(agent);
  assert.deepEqual(selection, { providerId: 'ollama', modelId: 'llama3.1:8b' });
  delete process.env.GROQ_API_KEY;
});

test('throws when every provider is unconfigured or has no model assigned', () => {
  delete process.env.GROQ_API_KEY;
  const agent = fakeAgent({ providerPreference: ['groq'], modelByProvider: {} });
  assert.throws(() => selectProvider(agent), /No usable provider/);
});
