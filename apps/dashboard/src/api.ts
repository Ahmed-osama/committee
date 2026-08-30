import type { AgentSummary, Alert, Task, TaskDetail } from './types.js';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(err.error ?? `POST ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getAgents: () => get<AgentSummary[]>('/agents'),
  getTasks: () => get<Task[]>('/tasks'),
  getTaskDetail: (id: string) => get<TaskDetail>(`/tasks/${id}`),
  getAlerts: () => get<Alert[]>('/alerts'),
  approveTask: (id: string) => post<{ branch: string; prUrl?: string; commitWarning?: string }>(`/tasks/${id}/approve`),
  rejectTask: (id: string, feedback: string) => post<{ ok: true }>(`/tasks/${id}/reject`, { feedback }),
};

export function connectWebSocket(onEvent: (raw: string) => void): () => void {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  let ws: WebSocket | undefined;
  let closed = false;
  let retryDelay = 1000;

  function connect() {
    if (closed) return;
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onmessage = (event) => onEvent(event.data as string);
    ws.onclose = () => {
      if (closed) return;
      // The daemon isn't always running — reconnect with backoff rather
      // than giving up, so the dashboard recovers on its own once it is.
      setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    };
    ws.onopen = () => {
      retryDelay = 1000;
    };
  }
  connect();

  return () => {
    closed = true;
    ws?.close();
  };
}
