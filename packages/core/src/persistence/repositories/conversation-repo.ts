import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Conversation, ConversationStatus } from '../../domain/conversation.js';
import { db } from '../db.js';
import { conversations, messages } from '../schema.js';

export function createConversation(goal: string): Conversation {
  const now = new Date().toISOString();
  const conversation: Conversation = { id: randomUUID(), goal, status: 'in_progress', createdAt: now, updatedAt: now };
  db.insert(conversations).values(conversation).run();
  return conversation;
}

export function getConversation(id: string): Conversation | undefined {
  return db.select().from(conversations).where(eq(conversations.id, id)).get() as Conversation | undefined;
}

export function updateConversationStatus(id: string, status: ConversationStatus, linearEpicUrl?: string): Conversation {
  const existing = getConversation(id);
  if (!existing) throw new Error(`Conversation not found: ${id}`);
  const updated: Conversation = { ...existing, status, linearEpicUrl: linearEpicUrl ?? existing.linearEpicUrl, updatedAt: new Date().toISOString() };
  db.update(conversations).set(updated).where(eq(conversations.id, id)).run();
  return updated;
}

export function setConversationPlanVisual(id: string, planVisualSvg: string): Conversation {
  const existing = getConversation(id);
  if (!existing) throw new Error(`Conversation not found: ${id}`);
  const updated: Conversation = { ...existing, planVisualSvg, updatedAt: new Date().toISOString() };
  db.update(conversations).set(updated).where(eq(conversations.id, id)).run();
  return updated;
}

export function deleteConversation(id: string): void {
  db.delete(messages).where(eq(messages.conversationId, id)).run();
  db.delete(conversations).where(eq(conversations.id, id)).run();
}
