import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { desc } from 'drizzle-orm';
import { runPlanningSession } from '../conversation/planning-session.js';
import type { Message } from '../domain/message.js';
import type { Conversation } from '../domain/conversation.js';
import { EventBus } from '../orchestrator/event-bus.js';
import { db } from '../persistence/db.js';
import {
  getOrCreateDefaultArchitect,
  getOrCreateDefaultDevilsAdvocate,
  getOrCreateDefaultEstimator,
  getOrCreateDefaultPlanner,
  getOrCreateDefaultReviewer,
  getOrCreateDefaultSkeptic,
  getOrCreateDefaultVisualizer,
} from '../persistence/repositories/agent-repo.js';
import { runExecutionTurn } from '../execution/execute-command.js';
import { generatePlanVisual } from '../conversation/generate-plan-visual.js';
import { generateConversationTitle } from '../conversation/generate-conversation-title.js';
import {
  createConversation,
  deleteConversation,
  getConversation,
  setConversationPlanVisual,
  setConversationTitle,
  updateConversationStatus,
} from '../persistence/repositories/conversation-repo.js';
import { getConversationTranscript } from '../persistence/repositories/message-repo.js';
import { conversations } from '../persistence/schema.js';
import { drain, enqueue } from '../orchestrator/injection-queue.js';
import { clearStop, isStopRequested, requestStop } from '../orchestrator/stop-registry.js';
import { clearPause, isPaused, requestPause } from '../orchestrator/pause-registry.js';
import { isAgentReady, selectProvider } from '../provider/provider-router.js';
import type { AgentConfig } from '../domain/agent.js';
import { PAGE_HTML } from './page.js';

const MAX_TURNS_LIMIT = 100;

// Repo root's docs/ — the living-docs and learning-journal pages that
// document-update/learning-digest keep editing on disk. Served straight
// from disk (not embedded) so an already-open tab's poll picks up edits
// the moment the background skill writes them, no server restart needed.
const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'docs');

function serveDocFile(res: ServerResponse, filename: string): void {
  try {
    const html = readFileSync(join(DOCS_DIR, filename), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch {
    sendJson(res, 404, { error: 'not found' });
  }
}

const bus = new EventBus();

/** The full pool of roles the committee can seat — actual roster is whichever of these `isAgentReady` picks out. */
function agentPool(): AgentConfig[] {
  return [
    getOrCreateDefaultPlanner(),
    getOrCreateDefaultArchitect(),
    getOrCreateDefaultSkeptic(),
    getOrCreateDefaultDevilsAdvocate(),
    getOrCreateDefaultEstimator(),
    getOrCreateDefaultReviewer(),
  ];
}

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

interface SelectedRoster {
  roster: AgentConfig[];
  finalizerId: string;
}

/**
 * Only seat agents that actually have a usable provider right now — an
 * agent with every provider unconfigured/rate-limited would otherwise just
 * sit in the roster failing every turn it's dealt. With shared
 * strength-ordered providers, this naturally grows the committee to as many
 * roles as providers currently support. Shared by both a fresh plan and a
 * regenerate — the roster is re-selected each time rather than reused,
 * since provider availability can shift between the two.
 */
function selectRoster(): SelectedRoster | undefined {
  const pool = agentPool();
  const architect = pool.find((a) => a.role === 'architect')!;
  const roster = pool.filter(isAgentReady);
  if (roster.length === 0) return undefined;
  const finalizer = roster.find((a) => a.id === architect.id) ?? roster[0];
  return { roster, finalizerId: finalizer.id };
}

/**
 * Fire-and-forget from the HTTP handler's perspective — a conversation can
 * take a minute or more, so the response above returns immediately and the
 * client watches progress via the SSE stream instead. Shared by a fresh
 * plan and a regenerate, which differ only in `sessionOpts`
 * (initialTranscript/startTurn).
 */
function runSessionAndFinalize(
  conversation: Conversation,
  roster: AgentConfig[],
  finalizerId: string,
  sessionOpts: { maxTurns?: number; initialTranscript?: Message[]; startTurn?: number } = {},
): void {
  runPlanningSession({
    conversationId: conversation.id,
    goal: conversation.goal,
    agents: roster,
    finalizerAgentId: finalizerId,
    pollInjected: drain,
    isStopRequested,
    isPaused,
    onPausedChange: (paused) => bus.emitPaused(conversation.id, paused),
    onMessage: (message) => bus.emitMessage(message),
    onThinking: (info) => bus.emitThinking(conversation.id, info),
    ...sessionOpts,
  })
    .then(async (result) => {
      updateConversationStatus(conversation.id, result.stopped ? 'stopped' : result.finalized ? 'finalized' : 'failed');
      if (!result.finalized || !result.plan) return;

      // One-shot, outside the round-robin debate — the visualizer never gets a
      // turn in runPlanningSession, it's only invoked here once a plan exists.
      const visualizer = getOrCreateDefaultVisualizer();
      if (!isAgentReady(visualizer)) return;
      try {
        const svg = await generatePlanVisual({ agent: visualizer, plan: result.plan });
        setConversationPlanVisual(conversation.id, svg);
      } catch (err) {
        console.error('Plan visual generation failed:', err);
      }
    })
    .catch((err) => {
      console.error('Planning session failed:', err);
      updateConversationStatus(conversation.id, 'failed');
    })
    .finally(() => {
      clearStop(conversation.id);
      clearPause(conversation.id);
      bus.emitFinalized(conversation.id);
    });
}

async function handleStartPlan(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let goal: string | undefined;
  let maxTurns: number | undefined;
  try {
    ({ goal, maxTurns } = JSON.parse(await readBody(req)) as { goal?: string; maxTurns?: number });
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON body' });
  }
  if (!goal?.trim()) return sendJson(res, 400, { error: 'goal is required' });
  if (maxTurns !== undefined && (!Number.isFinite(maxTurns) || maxTurns < 1 || maxTurns > MAX_TURNS_LIMIT)) {
    return sendJson(res, 400, { error: `maxTurns must be between 1 and ${MAX_TURNS_LIMIT}` });
  }

  const selected = selectRoster();
  if (!selected) return sendJson(res, 503, { error: 'no agent has a usable provider right now — check API keys / rate limits' });
  const { roster, finalizerId } = selected;

  const conversation = createConversation(goal.trim());

  sendJson(res, 202, { conversationId: conversation.id });

  generateConversationTitle({ agent: roster[0], goal: conversation.goal })
    .then((title) => setConversationTitle(conversation.id, title))
    .catch((err) => console.error('Title generation failed:', err));

  runSessionAndFinalize(conversation, roster, finalizerId, { maxTurns });
}

async function handleRegenerate(req: IncomingMessage, res: ServerResponse, conversationId: string): Promise<void> {
  let content: string | undefined;
  try {
    ({ content } = JSON.parse(await readBody(req)) as { content?: string });
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON body' });
  }
  if (!content?.trim()) return sendJson(res, 400, { error: 'content is required' });

  const conversation = getConversation(conversationId);
  if (!conversation) return sendJson(res, 404, { error: 'not found' });
  if (conversation.status === 'in_progress') return sendJson(res, 409, { error: 'conversation is already in progress' });

  const selected = selectRoster();
  if (!selected) return sendJson(res, 503, { error: 'no agent has a usable provider right now — check API keys / rate limits' });
  const { roster, finalizerId } = selected;

  const startTurn = (getConversationTranscript(conversationId).at(-1)?.turn ?? -1) + 1;
  // Reuses the same injection-queue the live loop already polls — the new
  // session's first turn drains and persists this as a normal human
  // message, no special-casing needed.
  enqueue(conversationId, content.trim());
  updateConversationStatus(conversationId, 'in_progress');

  sendJson(res, 202, {});

  runSessionAndFinalize(conversation, roster, finalizerId, {
    initialTranscript: getConversationTranscript(conversationId),
    startTurn,
  });
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
  const offThinking = bus.onThinking((id, info) => {
    if (id === conversationId) res.write(`event: thinking\ndata: ${JSON.stringify(info)}\n\n`);
  });
  const offFinalized = bus.onFinalized((id: string) => {
    if (id === conversationId) {
      res.write(`event: finalized\ndata: {}\n\n`);
      res.end();
    }
  });
  const offPaused = bus.onPaused((id, paused) => {
    if (id === conversationId) res.write(`event: paused\ndata: ${JSON.stringify({ paused })}\n\n`);
  });
  req.on('close', () => {
    offMessage();
    offThinking();
    offFinalized();
    offPaused();
  });
}

async function handleInject(req: IncomingMessage, res: ServerResponse, conversationId: string): Promise<void> {
  let content: string | undefined;
  try {
    ({ content } = JSON.parse(await readBody(req)) as { content?: string });
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON body' });
  }
  if (!content?.trim()) return sendJson(res, 400, { error: 'content is required' });

  const conversation = getConversation(conversationId);
  if (!conversation) return sendJson(res, 404, { error: 'not found' });

  if (conversation.status === 'in_progress') {
    enqueue(conversationId, content.trim());
    // Sending a message is what un-blocks a paused loop — no separate resume click needed.
    clearPause(conversationId);
    return sendJson(res, 202, {});
  }

  // The planning loop has already ended — there's no live round-robin to
  // steer anymore, so treat this as a direct command against the real
  // codebase instead: one agent, real tools, acting on what you typed.
  const executor = agentPool().find(isAgentReady);
  if (!executor) return sendJson(res, 503, { error: 'no agent has a usable provider right now — check API keys / rate limits' });

  const lastTurn = getConversationTranscript(conversationId).at(-1)?.turn ?? -1;
  try {
    const { humanMessage, agentMessage } = await runExecutionTurn({ conversationId, agent: executor, command: content.trim(), turn: lastTurn + 1 });
    sendJson(res, 200, { messages: [humanMessage, agentMessage] });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}

function handleStop(res: ServerResponse, conversationId: string): void {
  const conversation = getConversation(conversationId);
  if (!conversation) return sendJson(res, 404, { error: 'not found' });
  if (conversation.status !== 'in_progress') return sendJson(res, 409, { error: 'conversation is not in progress' });

  requestStop(conversationId);
  sendJson(res, 202, {});
}

function handlePause(res: ServerResponse, conversationId: string): void {
  const conversation = getConversation(conversationId);
  if (!conversation) return sendJson(res, 404, { error: 'not found' });
  if (conversation.status !== 'in_progress') return sendJson(res, 409, { error: 'conversation is not in progress' });

  requestPause(conversationId);
  sendJson(res, 202, {});
}

function handleResume(res: ServerResponse, conversationId: string): void {
  const conversation = getConversation(conversationId);
  if (!conversation) return sendJson(res, 404, { error: 'not found' });

  clearPause(conversationId);
  sendJson(res, 202, {});
}

function handleListAgents(res: ServerResponse): void {
  sendJson(
    res,
    200,
    agentPool().map((a) => {
      // Best-effort — the roster is a static preview of who'll likely answer;
      // the per-turn providerId/modelId on each Message is the actual fact.
      let providerId: string | undefined;
      let modelId: string | undefined;
      try {
        ({ providerId, modelId } = selectProvider(a));
      } catch {
        // no provider currently usable for this agent — leave undefined, the UI just omits the badge
      }
      return { id: a.id, name: a.name, role: a.role, providerId, modelId };
    }),
  );
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

function handleDeleteConversation(res: ServerResponse, id: string): void {
  if (!getConversation(id)) return sendJson(res, 404, { error: 'not found' });
  deleteConversation(id);
  sendJson(res, 200, {});
}

export interface WebServerHandle {
  port: number;
  close: () => Promise<void>;
}

export function startWebServer(port = 3000): Promise<WebServerHandle> {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    // The root page and a per-conversation deep link both serve the same
    // client-routed single-page shell — page.ts parses the path on load.
    if (req.method === 'GET' && (url.pathname === '/' || /^\/c\/[^/]+$/.test(url.pathname))) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
      res.end(PAGE_HTML);
      return;
    }
    if (req.method === 'GET' && (url.pathname === '/docs' || url.pathname === '/docs/' || url.pathname === '/docs/index.html')) {
      serveDocFile(res, 'index.html');
      return;
    }
    if (req.method === 'GET' && url.pathname === '/docs/learning.html') {
      serveDocFile(res, 'learning.html');
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/plan') {
      void handleStartPlan(req, res);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/agents') {
      handleListAgents(res);
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
    const injectMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/inject$/);
    if (req.method === 'POST' && injectMatch) {
      void handleInject(req, res, injectMatch[1]);
      return;
    }
    const regenerateMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/regenerate$/);
    if (req.method === 'POST' && regenerateMatch) {
      void handleRegenerate(req, res, regenerateMatch[1]);
      return;
    }
    const stopMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/stop$/);
    if (req.method === 'POST' && stopMatch) {
      handleStop(res, stopMatch[1]);
      return;
    }
    const pauseMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/pause$/);
    if (req.method === 'POST' && pauseMatch) {
      handlePause(res, pauseMatch[1]);
      return;
    }
    const resumeMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/resume$/);
    if (req.method === 'POST' && resumeMatch) {
      handleResume(res, resumeMatch[1]);
      return;
    }
    const getMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)$/);
    if (req.method === 'GET' && getMatch) {
      handleGetConversation(res, getMatch[1]);
      return;
    }
    if (req.method === 'DELETE' && getMatch) {
      handleDeleteConversation(res, getMatch[1]);
      return;
    }
    sendJson(res, 404, { error: 'not found' });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve({ port, close: () => new Promise((r) => server.close(() => r())) }));
  });
}
