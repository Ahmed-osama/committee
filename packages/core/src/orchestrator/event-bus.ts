import { EventEmitter } from 'node:events';
import type { Message } from '../domain/message.js';
import type { Task, TaskStatus } from '../domain/task.js';

export interface TaskStatusChangedEvent {
  taskId: string;
  from: TaskStatus;
  to: TaskStatus;
}

/**
 * Both the orchestrator's own internals and (later) the dashboard's
 * WebSocket bridge subscribe to this same bus — a dashboard is a pure
 * observer bolted on top of an already-running system, not something the
 * scheduler needs to know exists.
 */
export class EventBus {
  private readonly emitter = new EventEmitter();

  emitTick(tick: number): void {
    this.emitter.emit('tick', tick);
  }
  onTick(handler: (tick: number) => void): void {
    this.emitter.on('tick', handler);
  }

  emitMessage(message: Message): void {
    this.emitter.emit('message', message);
  }
  onMessage(handler: (message: Message) => void): void {
    this.emitter.on('message', handler);
  }

  emitTaskStatusChanged(event: TaskStatusChangedEvent): void {
    this.emitter.emit('task-status-changed', event);
  }
  onTaskStatusChanged(handler: (event: TaskStatusChangedEvent) => void): void {
    this.emitter.on('task-status-changed', handler);
  }

  emitAgentTurnEnd(agentId: string, tick: number, task: Task | undefined): void {
    this.emitter.emit('agent-turn-end', { agentId, tick, task });
  }
  onAgentTurnEnd(handler: (event: { agentId: string; tick: number; task: Task | undefined }) => void): void {
    this.emitter.on('agent-turn-end', handler);
  }
}
