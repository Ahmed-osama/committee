/**
 * A provider/model can fail at call time for reasons our own proactive
 * rate-limit tracker can't see in advance — e.g. a free-tier daily quota
 * that's stricter than what we've configured, or a transient outage. This
 * is a short in-memory "cool down" so a failure right now steers the very
 * next turn away from the same provider/model instead of retrying it
 * immediately and dying the same way.
 */
const downUntil = new Map<string, number>();

function key(providerId: string, modelId: string): string {
  return `${providerId}:${modelId}`;
}

export function markProviderDown(providerId: string, modelId: string, forMs = 5 * 60_000): void {
  downUntil.set(key(providerId, modelId), Date.now() + forMs);
}

export function isProviderDown(providerId: string, modelId: string): boolean {
  const until = downUntil.get(key(providerId, modelId));
  return until !== undefined && Date.now() < until;
}
