import type { AgentSummary } from '../types.js';

export function AgentCard({ agent }: { agent: AgentSummary }) {
  return (
    <div className={`agent-card agent-card--${agent.status}`}>
      <div className="agent-card__pulse" />
      <div className="agent-card__body">
        <div className="agent-card__name">{agent.name}</div>
        <div className="agent-card__role">{agent.role}</div>
        <div className="agent-card__status">{agent.status === 'working' ? `working on ${agent.taskId?.slice(0, 8)}` : 'idle'}</div>
      </div>
    </div>
  );
}
