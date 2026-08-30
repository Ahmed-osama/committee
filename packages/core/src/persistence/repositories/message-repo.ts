import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import type { Message } from '../../domain/message.js';
import { db } from '../db.js';
import { messages } from '../schema.js';

export function sendMessage(input: Omit<Message, 'id' | 'createdAt'>): Message {
  const message: Message = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  db.insert(messages).values(message).run();
  return message;
}

/** The full transcript of a conversation, in turn order. */
export function getConversationTranscript(conversationId: string): Message[] {
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.turn)).all() as Message[];
}
