import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { desc } from 'drizzle-orm';
import { runPlanningSession } from '../conversation/planning-session.js';
import type { Message } from '../domain/message.js';
import { EventBus } from '../orchestrator/event-bus.js';
import { db } from '../persistence/db.js';
import { getOrCreateDefaultArchitect, getOrCreateDefaultPlanner, getOrCreateDefaultSkeptic } from '../persistence/repositories/agent-repo.js';
import { createConversation, getConversation, updateConversationStatus } from '../persistence/repositories/conversation-repo.js';
import { getConversationTranscript } from '../persistence/repositories/message-repo.js';
import { conversations } from '../persistence/schema.js';
import { PAGE_HTML } from './page.js';

const bus = new EventBus();

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleStartPlan(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let goal: string | undefined;
  try {
    ({ goal } = JSON.parse(await readBody(req)) as { goal?: string });
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON body' });
  }
  if (!goal?.trim()) return sendJson(res, 400, { error: 'goal is required' });

  const planner = getOrCreateDefaultPlanner();
  const architect = getOrCreateDefaultArchitect();
  const skeptic = getOrCreateDefaultSkeptic();
  const conversation = createConversation(goal.trim());

  sendJson(res, 202, { conversationId: conversation.id });

  // Fire-and-forget from the HTTP handler's perspective — a conversation
  // can take a minute or more, so the response above returns immediately
  // and the client watches progress via the SSE stream instead.
  runPlanningSession({
    conversationId: conversation.id,
    goal: conversation.goal,
    agents: [planner, architect, skeptic],
    finalizerAgentId: architect.id,
    onMessage: (message) => bus.emitMessage(message),
  })
    .then((result) => updateConversationStatus(conversation.id, result.finalized ? 'finalized' : 'failed'))
    .catch((err) => {
      console.error('Planning session failed:', err);
      updateConversationStatus(conversation.id, 'failed');
    })
    .finally(() => bus.emitFinalized(conversation.id));
}

function handleEvents(req: IncomingMessage, res: ServerResponse, conversationId: string): void {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });

  // Replay whatever already happened, so connecting mid-conversation (or
  // reloading the page) doesn't lose earlier turns.
  for (const message of getConversationTranscript(conversationId)) {
    res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
  }
  const existing = getConversation(conversationId);
  if (existing && existing.status !== 'in_progress') {
    res.write(`event: finalized\ndata: {}\n\n`);
    res.end();
    return;
  }

  const offMessage = bus.onMessage((message: Message) => {
    if (message.conversationId === conversationId) res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
  });
  const offFinalized = bus.onFinalized((id: string) => {
    if (id === conversationId) {
      res.write(`event: finalized\ndata: {}\n\n`);
      res.end();
    }
  });
  req.on('close', () => {
    offMessage();
    offFinalized();
  });
}

function handleListConversations(res: ServerResponse): void {
  const rows = db.select().from(conversations).orderBy(desc(conversations.createdAt)).all();
  sendJson(res, 200, rows);
}

function handleGetConversation(res: ServerResponse, id: string): void {
  const conversation = getConversation(id);
  if (!conversation) return sendJson(res, 404, { error: 'not found' });
  sendJson(res, 200, { conversation, transcript: getConversationTranscript(id) });
}

export interface WebServerHandle {
  port: number;
  close: () => Promise<void>;
}

export function startWebServer(port = 3000): Promise<WebServerHandle> {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(PAGE_HTML);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/plan') {
      void handleStartPlan(req, res);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/conversations') {
      handleListConversations(res);
      return;
    }
    const eventsMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/events$/);
    if (req.method === 'GET' && eventsMatch) {
      handleEvents(req, res, eventsMatch[1]);
      return;
    }
    const getMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)$/);
    if (req.method === 'GET' && getMatch) {
      handleGetConversation(res, getMatch[1]);
      return;
    }
    sendJson(res, 404, { error: 'not found' });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve({ port, close: () => new Promise((r) => server.close(() => r())) }));
  });
}
