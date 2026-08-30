import { createServer, type Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import type { AgentConfig } from '../domain/agent.js';
import { approveTask, rejectTask } from '../approval/approve-task.js';
import type { EventBus } from '../orchestrator/event-bus.js';
import { findNextCoderTask, findNextReviewTask, getAllTasks, getTask } from '../persistence/repositories/task-repo.js';
import { getDecisionsForTask } from '../persistence/repositories/decision-repo.js';
import { getAllMessages } from '../persistence/repositories/message-repo.js';
import { getUnacknowledgedAlerts } from '../persistence/repositories/alert-repo.js';
import { GitWorkspace } from '../tools/dev-shop/git-workspace.js';

export interface StartDashboardServerOptions {
  bus: EventBus;
  agents: AgentConfig[];
  port: number;
}

export interface DashboardServerHandle {
  server: Server;
  close: () => Promise<void>;
}

function agentStatus(agent: AgentConfig): { status: 'idle' | 'working'; taskId?: string } {
  const task = agent.role === 'coder' ? findNextCoderTask(agent.id) : agent.role === 'reviewer' ? findNextReviewTask() : undefined;
  return task ? { status: 'working', taskId: task.id } : { status: 'idle' };
}

function taskDiff(taskId: string): string | undefined {
  const task = getTask(taskId);
  if (!task?.workspacePath) return undefined;
  try {
    return GitWorkspace.reattach(task).diff();
  } catch {
    return undefined; // workspace already cleaned up (task is done) — no diff to show, not an error
  }
}

function json(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

async function readJsonBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

/**
 * Local-only by design (no auth) — this binds to a port on your own
 * machine for your own dashboard to talk to. Add authentication before
 * ever exposing this beyond localhost.
 *
 * Runs inside the daemon process rather than as a separate server,
 * specifically so it can share the daemon's actual EventBus instance —
 * events are in-process only (plain EventEmitter), so a separate process
 * would see nothing live without inventing cross-process pub/sub, which
 * the plan explicitly defers until there's real evidence one process is a
 * bottleneck. `committee tick <n>` run from a different terminal still
 * updates the database the dashboard reads from; it just won't show up as
 * a live push until the dashboard's next REST refetch, since that tick's
 * events fire on a different EventBus instance than this one.
 */
export function startDashboardServer(opts: StartDashboardServerOptions): DashboardServerHandle {
  const { bus, agents, port } = opts;

  const server = createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean); // ['api', 'tasks', ':id', ...]

      if (req.method === 'OPTIONS') {
        json(res, 204, null);
        return;
      }

      try {
        if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'agents') {
          json(
            res,
            200,
            agents.map((a) => ({ id: a.id, name: a.name, role: a.role, ...agentStatus(a) })),
          );
          return;
        }

        if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'tasks' && parts.length === 2) {
          json(res, 200, getAllTasks());
          return;
        }

        if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'tasks' && parts[2]) {
          const task = getTask(parts[2]);
          if (!task) {
            json(res, 404, { error: 'not found' });
            return;
          }
          json(res, 200, {
            task,
            decisions: getDecisionsForTask(task.id),
            messages: getAllMessages().filter((m) => (m.payload as { taskId?: string })?.taskId === task.id),
            diff: taskDiff(task.id),
          });
          return;
        }

        if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'tasks' && parts[2] && parts[3] === 'approve') {
          const result = await approveTask(parts[2]);
          json(res, 200, result);
          return;
        }

        if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'tasks' && parts[2] && parts[3] === 'reject') {
          const body = (await readJsonBody(req)) as { feedback?: string };
          rejectTask(parts[2], body.feedback ?? '');
          json(res, 200, { ok: true });
          return;
        }

        if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'alerts') {
          json(res, 200, getUnacknowledgedAlerts());
          return;
        }

        json(res, 404, { error: 'not found' });
      } catch (err) {
        json(res, 500, { error: (err as Error).message });
      }
    })();
  });

  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set<WebSocket>();

  function broadcast(type: string, data: unknown): void {
    const frame = JSON.stringify({ type, data });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) client.send(frame);
    }
  }

  bus.onTick((tick) => broadcast('tick', { tick }));
  bus.onMessage((message) => broadcast('message', message));
  bus.onTaskStatusChanged((event) => broadcast('task-status-changed', event));
  bus.onAgentTurnEnd((event) => broadcast('agent-turn-end', event));

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  server.listen(port);

  return {
    server,
    close: () =>
      new Promise((resolve) => {
        for (const client of clients) client.terminate();
        wss.close(() => server.close(() => resolve()));
      }),
  };
}
