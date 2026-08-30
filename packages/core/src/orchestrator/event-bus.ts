import { EventEmitter } from 'node:events';
import type { Message } from '../domain/message.js';

/**
 * Backs the live web viewer: a planning session publishes each new message
 * here as it happens, and the viewer's SSE endpoint subscribes — the
 * viewer is a pure observer bolted on top of an already-running
 * conversation, not something the conversation engine needs to know exists.
 * Each `on*` returns an unsubscribe function — every SSE connection needs
 * to remove its listener on disconnect, or the bus leaks one per visit.
 */
export class EventBus {
  private readonly emitter = new EventEmitter();

  emitMessage(message: Message): void {
    this.emitter.emit('message', message);
  }
  onMessage(handler: (message: Message) => void): () => void {
    this.emitter.on('message', handler);
    return () => this.emitter.off('message', handler);
  }

  emitFinalized(conversationId: string): void {
    this.emitter.emit('finalized', conversationId);
  }
  onFinalized(handler: (conversationId: string) => void): () => void {
    this.emitter.on('finalized', handler);
    return () => this.emitter.off('finalized', handler);
  }
}
