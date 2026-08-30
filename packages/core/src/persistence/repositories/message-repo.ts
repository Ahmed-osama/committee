import { randomUUID } from 'node:crypto';
import { desc, eq, gt, isNull, or } from 'drizzle-orm';
import type { Message } from '../../domain/message.js';
import { db } from '../db.js';
import { messages } from '../schema.js';

export function sendMessage(input: Omit<Message, 'id' | 'createdAt'>): Message {
  const message: Message = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  db.insert(messages).values(message).run();
  return message;
}

/** Messages addressed to this agent directly, plus broadcasts (toAgentId null), newest first. */
export function getMessagesForAgent(agentId: string, sinceTick = -1): Message[] {
  return db
    .select()
    .from(messages)
    .where(or(eq(messages.toAgentId, agentId), isNull(messages.toAgentId)))
    .orderBy(desc(messages.tick))
    .all()
    .filter((m) => m.tick > sinceTick) as Message[];
}

export function getAllMessages(sinceTick = -1): Message[] {
  return db.select().from(messages).where(gt(messages.tick, sinceTick)).orderBy(messages.tick).all() as Message[];
}
