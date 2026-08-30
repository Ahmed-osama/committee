import { eq } from 'drizzle-orm';
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
  providerPreference: ['ollama'],
  toolAllowList: ['list_files', 'read_file', 'write_file', 'run_tests', 'run_lint', 'finish_task'],
};

export function getOrCreateDefaultCoder(): AgentConfig {
  const existing = db.select().from(agents).where(eq(agents.id, DEFAULT_CODER.id)).get() as AgentConfig | undefined;
  if (existing) return existing;
  db.insert(agents).values(DEFAULT_CODER).run();
  return DEFAULT_CODER;
}
