/**
 * A running planning session is a plain in-process for-loop with no polling
 * mechanism of its own — this is the minimal shared mutable store that lets
 * an HTTP request (the inject endpoint) hand a message to a loop it isn't
 * otherwise connected to, without restructuring the loop into something
 * event-driven.
 */
const queues = new Map<string, string[]>();

export function enqueue(conversationId: string, text: string): void {
  const queue = queues.get(conversationId);
  if (queue) queue.push(text);
  else queues.set(conversationId, [text]);
}

/** Empties and returns whatever's queued for this conversation. */
export function drain(conversationId: string): string[] {
  const queue = queues.get(conversationId);
  if (!queue || queue.length === 0) return [];
  queues.set(conversationId, []);
  return queue;
}
