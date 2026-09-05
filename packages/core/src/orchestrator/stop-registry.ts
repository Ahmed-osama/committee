/**
 * Same shape as injection-queue.ts: the HTTP handler for the stop button
 * isn't otherwise connected to the in-process for-loop running the
 * conversation, so this is the minimal shared mutable store that lets one
 * request tell that loop to bail at the top of its next turn.
 */
const stopped = new Set<string>();

export function requestStop(conversationId: string): void {
  stopped.add(conversationId);
}

export function isStopRequested(conversationId: string): boolean {
  return stopped.has(conversationId);
}

export function clearStop(conversationId: string): void {
  stopped.delete(conversationId);
}
