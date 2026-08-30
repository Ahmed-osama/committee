import { useCallback, useEffect, useRef, useState } from 'react';
import { api, connectWebSocket } from './api.js';
import { AgentCard } from './components/AgentCard.js';
import { TaskBoard } from './components/TaskBoard.js';
import { TaskDetailPanel } from './components/TaskDetailPanel.js';
import { ActivityFeed, type ActivityEntry } from './components/ActivityFeed.js';
import { AlertsBanner } from './components/AlertsBanner.js';
import type { AgentSummary, Alert, Task, WsEvent } from './types.js';

let entryId = 0;

export function App() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [tick, setTick] = useState<number | undefined>();
  const [connected, setConnected] = useState(false);

  const pushActivity = useCallback((text: string) => {
    setActivity((prev) => [{ id: String(entryId++), text }, ...prev].slice(0, 100));
  }, []);

  const refetch = useCallback(() => {
    api.getAgents().then(setAgents).catch(console.error);
    api.getTasks().then(setTasks).catch(console.error);
    api.getAlerts().then(setAlerts).catch(console.error);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    const disconnect = connectWebSocket((raw) => {
      setConnected(true);
      const event = JSON.parse(raw) as WsEvent;
      if (event.type === 'tick') {
        setTick(event.data.tick);
      } else if (event.type === 'message') {
        const to = event.data.toAgentId ?? 'everyone';
        pushActivity(`${event.data.fromAgentId} → ${to}: ${JSON.stringify(event.data.payload)}`);
      } else if (event.type === 'task-status-changed') {
        pushActivity(`task ${event.data.taskId.slice(0, 8)}: ${event.data.from} → ${event.data.to}`);
        refetchRef.current();
      }
    });
    return disconnect;
  }, [pushActivity]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>committee</h1>
        <span className={`conn-indicator conn-indicator--${connected ? 'on' : 'off'}`}>
          {connected ? `live · tick ${tick ?? '—'}` : 'connecting…'}
        </span>
      </header>

      <AlertsBanner alerts={alerts} />

      <div className="agent-row">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>

      <div className="app__main">
        <TaskBoard tasks={tasks} selectedId={selectedTaskId} onSelect={setSelectedTaskId} />
        <ActivityFeed entries={activity} />
      </div>

      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(undefined)} onChanged={refetch} />
      )}
    </div>
  );
}
