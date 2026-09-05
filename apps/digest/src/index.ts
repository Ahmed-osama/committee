// Second consumer of @committee/core, deliberately not another planning-committee clone —
// one agent, one call, no debate loop. Ships against unmodified core; real gaps found along
// the way are logged in ./FRICTION.md, not silently patched over here.

// Must run before importing '@committee/core' at all: importing anything from it eagerly
// opens packages/core/committee.db as a module-level side effect (see FRICTION.md #2) —
// this keeps a plain `digest` run from touching committee's real db file.
process.env.COMMITTEE_DB_PATH ??= ':memory:';

import { generateText } from 'ai';
import { PROVIDER_REGISTRY, selectProvider, rotateProviderOrder, type AgentConfig } from '@committee/core';
import { appendHistory } from './history.js';

// Redeclared locally — core's own provider->model defaults (agent-repo.ts's
// SHARED_MODEL_BY_PROVIDER) aren't exported (see FRICTION.md #3).
const MODEL_BY_PROVIDER: Record<string, string> = {
  groq: 'qwen/qwen3.8-27b',
  gemini: 'gemini-3.6-flash',
  ollama: 'llama3.1:8b',
  anthropic: 'claude-sonnet-5',
  deepseek: 'deepseek-v4-flash',
  glm: 'glm-4-flash',
  openrouter: 'minimax/minimax-m3:free',
  perplexity: 'sonar',
};

// AgentRole has no generic "single-purpose worker" option (see FRICTION.md #4) — 'reviewer'
// is the least-wrong existing label for "look at one thing, report on it."
const digestAgent: AgentConfig = {
  id: 'digest',
  name: 'Digest',
  role: 'reviewer',
  systemPrompt:
    'You write a short digest (3-5 sentences) on the given topic: what it is and why it ' +
    "matters, for someone with no prior context. No headings, no bullet points, just prose.",
  providerPreference: rotateProviderOrder(0),
  modelByProvider: MODEL_BY_PROVIDER,
  toolAllowList: [],
};

async function main() {
  const topic = process.argv.slice(2).join(' ').trim();
  if (!topic) {
    console.error('Usage: pnpm --filter @committee/digest start "<topic>"');
    process.exitCode = 1;
    return;
  }

  // Mirrors, rather than reuses, core's internal generate-for-agent.ts — that helper isn't
  // exported and packages/core's `exports` map blocks reaching it via a subpath either
  // (see FRICTION.md #1).
  const { providerId, modelId } = selectProvider(digestAgent);
  const model = PROVIDER_REGISTRY[providerId].model(modelId);
  const { text } = await generateText({ model, system: digestAgent.systemPrompt, prompt: `Topic: ${topic}` });

  console.log(text);
  appendHistory({ topic, digest: text, at: new Date().toISOString() });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
