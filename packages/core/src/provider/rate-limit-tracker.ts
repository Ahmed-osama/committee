import { randomUUID } from 'node:crypto';
import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '../persistence/db.js';
import { providerCalls } from '../persistence/schema.js';
import { getRateLimitConfig } from './rate-limits.js';

export interface RateLimitStatus {
  availableNow: boolean;
  rpmUsed: number;
  rpmLimit?: number;
  rpdUsed: number;
  rpdLimit?: number;
}

function countCallsSince(providerId: string, modelId: string, sinceIso: string): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(providerCalls)
    .where(and(eq(providerCalls.providerId, providerId), eq(providerCalls.modelId, modelId), gte(providerCalls.createdAt, sinceIso)))
    .get();
  return row?.count ?? 0;
}

export function getRateLimitStatus(providerId: string, modelId: string): RateLimitStatus {
  const config = getRateLimitConfig(providerId, modelId);
  const now = Date.now();
  const rpmUsed = countCallsSince(providerId, modelId, new Date(now - 60_000).toISOString());
  const rpdUsed = countCallsSince(providerId, modelId, new Date(now - 24 * 60 * 60_000).toISOString());

  const availableNow = (config.rpm === undefined || rpmUsed < config.rpm) && (config.rpd === undefined || rpdUsed < config.rpd);

  return { availableNow, rpmUsed, rpmLimit: config.rpm, rpdUsed, rpdLimit: config.rpd };
}

export function recordProviderCall(input: {
  agentId: string;
  providerId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}): void {
  db.insert(providerCalls)
    .values({ ...input, id: randomUUID(), createdAt: new Date().toISOString() })
    .run();
}

export function getCallCountToday(agentId: string): number {
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(providerCalls)
    .where(and(eq(providerCalls.agentId, agentId), gte(providerCalls.createdAt, since)))
    .get();
  return row?.count ?? 0;
}

export function getSpendUsdToday(agentId: string): number {
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const row = db
    .select({ total: sql<number>`coalesce(sum(cost_usd), 0)` })
    .from(providerCalls)
    .where(and(eq(providerCalls.agentId, agentId), gte(providerCalls.createdAt, since)))
    .get();
  return row?.total ?? 0;
}
