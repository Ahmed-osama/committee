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
    // openai/gpt-oss-120b was tried first — reasoned well and picked correct
    // tool calls, but its "Harmony" response format occasionally leaks an
    // internal "commentary" channel as a bogus tool call, which crashes
    // generateText with a validation error. qwen3.8-27b doesn't have this
    // quirk in testing, so it's the safer default for now.
    groq: 'qwen/qwen3.8-27b',
    gemini: 'gemini-3.6-flash',
    ollama: 'llama3.1:8b',
    anthropic: 'claude-sonnet-5',
  },
  toolAllowList: ['list_files', 'read_file', 'write_file', 'run_tests', 'run_lint', 'finish_task'],
};

const DEFAULT_REVIEWER: AgentConfig = {
  id: 'default-reviewer',
  name: 'Reviewer',
  role: 'reviewer',
  systemPrompt:
    'You are a skeptical code reviewer. You independently verify the diff and test results yourself — you never ' +
    "trust the coder's summary at face value. You only approve work you would be comfortable shipping yourself. " +
    'A diff that changes an unrelated file, removes test coverage, or claims success without actually running ' +
    'tests is always a reason to request changes, never to approve.',
  providerPreference: ['groq', 'gemini', 'deepseek', 'glm', 'ollama', 'anthropic'],
  modelByProvider: {
    groq: 'qwen/qwen3.8-27b',
    gemini: 'gemini-3.6-flash',
    ollama: 'llama3.1:8b',
    anthropic: 'claude-sonnet-5',
  },
  toolAllowList: ['list_files', 'read_file', 'run_tests', 'run_lint', 'approve_for_human', 'request_changes'],
};

/**
 * Upserts rather than insert-once: these are code-defined defaults, not
 * user-customized agents, so they should always reflect whatever's in this
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

export function getOrCreateDefaultReviewer(): AgentConfig {
  db.insert(agents)
    .values(DEFAULT_REVIEWER)
    .onConflictDoUpdate({ target: agents.id, set: DEFAULT_REVIEWER })
    .run();
  return DEFAULT_REVIEWER;
}
