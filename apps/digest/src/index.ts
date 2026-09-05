// Second consumer of @committee/core, deliberately not another planning-committee clone —
// one agent, one call, no debate loop. Ships against unmodified core; real gaps found along
// the way are logged in ./FRICTION.md, not silently patched over here.

// Must run before importing '@committee/core' at all: importing anything from it eagerly
// opens packages/core/committee.db as a module-level side effect (see FRICTION.md #2) —
// this keeps a plain `digest` run from touching committee's real db file.
process.env.COMMITTEE_DB_PATH ??= ':memory:';

import { generateForAgent, rotateProviderOrder, SHARED_MODEL_BY_PROVIDER, type AgentConfig } from '@committee/core';
import { appendHistory } from './history.js';

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
  modelByProvider: SHARED_MODEL_BY_PROVIDER,
  toolAllowList: [],
};

async function main() {
  const topic = process.argv.slice(2).join(' ').trim();
  if (!topic) {
    console.error('Usage: pnpm --filter @committee/digest start "<topic>"');
    process.exitCode = 1;
    return;
  }

  // generateForAgent has no separate `system` param — callers fold the agent's persona into
  // the one prompt string (same convention planning-session.ts uses).
  const prompt = [digestAgent.systemPrompt, `Topic: ${topic}`].join('\n\n');
  const { result } = await generateForAgent(digestAgent, prompt, {});

  console.log(result.text);
  appendHistory({ topic, digest: result.text, at: new Date().toISOString() });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
