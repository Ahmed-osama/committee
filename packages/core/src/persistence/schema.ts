import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  providerPreference: text('provider_preference', { mode: 'json' }).$type<string[]>().notNull(),
  modelByProvider: text('model_by_provider', { mode: 'json' }).$type<Record<string, string>>().notNull(),
  toolAllowList: text('tool_allow_list', { mode: 'json' }).$type<string[]>().notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  acceptanceCriteria: text('acceptance_criteria').notNull(),
  repoPath: text('repo_path').notNull(),
  baseBranch: text('base_branch').notNull(),
  status: text('status').notNull(),
  assignedAgentId: text('assigned_agent_id'),
  workspacePath: text('workspace_path'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  taskId: text('task_id'),
  tick: integer('tick').notNull(),
  kind: text('kind').notNull(),
  detail: text('detail', { mode: 'json' }).notNull(),
  createdAt: text('created_at').notNull(),
});

export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  status: text('status').notNull(), // 'pending' | 'approved' | 'rejected'
  reviewNote: text('review_note'),
  createdAt: text('created_at').notNull(),
  resolvedAt: text('resolved_at'),
});

// One event log serving two purposes: rate-limit windows (count rows in the
// last minute/day) and spend tracking (sum costUsd) — both are just
// different queries over "what LLM calls actually happened."
export const providerCalls = sqliteTable('provider_calls', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  providerId: text('provider_id').notNull(),
  modelId: text('model_id').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  costUsd: real('cost_usd').notNull(),
  createdAt: text('created_at').notNull(),
});
