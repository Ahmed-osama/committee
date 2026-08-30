import type { Task, TaskStatus } from '../types.js';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'in_progress', label: 'Coding' },
  { status: 'pending_auto_review', label: 'Auto-review' },
  { status: 'awaiting_review', label: 'Awaiting you' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'done', label: 'Done' },
];

export function TaskBoard({ tasks, selectedId, onSelect }: { tasks: Task[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <div className="task-board">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.status || (col.status === 'in_progress' && t.status === 'claimed'));
        return (
          <div key={col.status} className="task-column">
            <div className="task-column__header">
              {col.label} <span className="task-column__count">{items.length}</span>
            </div>
            {items.map((t) => (
              <button
                key={t.id}
                className={`task-card task-card--${t.status}${t.id === selectedId ? ' task-card--selected' : ''}`}
                onClick={() => onSelect(t.id)}
              >
                <div className="task-card__desc">{t.description}</div>
                {t.retryCount > 0 && <div className="task-card__retries">retry {t.retryCount}</div>}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
