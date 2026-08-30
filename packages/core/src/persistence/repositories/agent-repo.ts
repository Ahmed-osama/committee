import type { AgentConfig } from '../../domain/agent.js';
import { db } from '../db.js';
import { agents } from '../schema.js';

const DEFAULT_CODER: AgentConfig = {
  id: 'default-coder',
  name: 'Coder',
  role: 'coder',
  systemPrompt:
    'You are a careful software engineer. You make the smallest change that satisfies the task, ' +
    'run tests before declaring done, and never claim something works without having run it.',
  // Every model id here was verified live against the provider's own API
  // immediately before being added — cached knowledge of "current" model
  // names turned out to be stale for both Gemini and Groq within the same
  // session, so nothing gets hardcoded without checking first.
  // deepseek/glm shown in the preference order to signal intent, but left
  // out of modelByProvider until tested against a live key — the router
  // skips any provider with no modelByProvider entry, so this is safe.
  providerPreference: ['groq', 'gemini', 'deepseek', 'glm', 'ollama', 'anthropic'],
  modelByProvider: {
    groq: 'openai/gpt-oss-120b',
    gemini: 'gemini-3.6-flash',
    ollama: 'llama3.1:8b',
    anthropic: 'claude-sonnet-5',
  },
  toolAllowList: ['list_files', 'read_file', 'write_file', 'run_tests', 'run_lint', 'finish_task'],
};

/**
 * Upserts rather than insert-once: this is a code-defined default, not a
 * user-customized agent, so it should always reflect whatever's in this
 * file. An insert-once version bit twice while iterating on provider
 * config in the same session — a code change silently had no effect
 * because a stale row from before the change was still being served.
 */
export function getOrCreateDefaultCoder(): AgentConfig {
  db.insert(agents)
    .values(DEFAULT_CODER)
    .onConflictDoUpdate({ target: agents.id, set: DEFAULT_CODER })
    .run();
  return DEFAULT_CODER;
}
