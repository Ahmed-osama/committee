/**
 * Same shape as stop-registry.ts: the HTTP handlers for the pause/resume
 * buttons aren't otherwise connected to the in-process for-loop running the
 * conversation, so this is the minimal shared mutable store that lets one
 * request tell that loop to block at the top of its next turn, and another
 * tell it to carry on.
 */
const paused = new Set<string>();

export function requestPause(conversationId: string): void {
  paused.add(conversationId);
}

export function clearPause(conversationId: string): void {
  paused.delete(conversationId);
}

export function isPaused(conversationId: string): boolean {
  return paused.has(conversationId);
}
