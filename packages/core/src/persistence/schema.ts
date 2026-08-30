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

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  goal: text('goal').notNull(),
  status: text('status').notNull(),
  linearEpicUrl: text('linear_epic_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// One turn in a planning conversation — broadcast (toAgentId null) is the
// normal case, since the whole point is that every agent sees every turn.
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  fromAgentId: text('from_agent_id').notNull(),
  toAgentId: text('to_agent_id'),
  intent: text('intent').notNull(),
  content: text('content').notNull(),
  payload: text('payload', { mode: 'json' }),
  turn: integer('turn').notNull(),
  createdAt: text('created_at').notNull(),
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
