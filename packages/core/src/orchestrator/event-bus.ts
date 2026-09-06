import { EventEmitter } from 'node:events';
import type { ThinkingInfo } from '../conversation/planning-session.js';
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

  emitThinking(conversationId: string, info: ThinkingInfo): void {
    this.emitter.emit('thinking', conversationId, info);
  }
  onThinking(handler: (conversationId: string, info: ThinkingInfo) => void): () => void {
    this.emitter.on('thinking', handler);
    return () => this.emitter.off('thinking', handler);
  }

  emitFinalized(conversationId: string): void {
    this.emitter.emit('finalized', conversationId);
  }
  onFinalized(handler: (conversationId: string) => void): () => void {
    this.emitter.on('finalized', handler);
    return () => this.emitter.off('finalized', handler);
  }

  emitPaused(conversationId: string, paused: boolean): void {
    this.emitter.emit('paused', conversationId, paused);
  }
  onPaused(handler: (conversationId: string, paused: boolean) => void): () => void {
    this.emitter.on('paused', handler);
    return () => this.emitter.off('paused', handler);
  }
}
