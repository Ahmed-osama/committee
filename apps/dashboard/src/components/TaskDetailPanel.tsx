import { useEffect, useState } from 'react';
import { api } from '../api.js';
import type { TaskDetail } from '../types.js';

export function TaskDetailPanel({ taskId, onClose, onChanged }: { taskId: string; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<TaskDetail | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(undefined);
    api
      .getTaskDetail(taskId)
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function approve() {
    setBusy(true);
    setError(undefined);
    try {
      await api.approveTask(taskId);
      onChanged();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    setError(undefined);
    try {
      await api.rejectTask(taskId, feedback);
      onChanged();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="detail-panel">
      <div className="detail-panel__header">
        <span>Task {taskId.slice(0, 8)}</span>
        <button onClick={onClose} className="detail-panel__close" aria-label="Close">
          ×
        </button>
      </div>
      {!detail && !error && <div className="detail-panel__loading">Loading…</div>}
      {error && <div className="detail-panel__error">{error}</div>}
      {detail && (
        <div className="detail-panel__body">
          <p className="detail-panel__desc">{detail.task.description}</p>
          <p className="detail-panel__criteria">
            <strong>Acceptance:</strong> {detail.task.acceptanceCriteria}
          </p>
          <p className="detail-panel__status">
            status: <code>{detail.task.status}</code>
            {detail.task.prUrl && (
              <>
                {' — '}
                <a href={detail.task.prUrl} target="_blank" rel="noreferrer">
                  PR
                </a>
              </>
            )}
          </p>

          {detail.diff && (
            <>
              <h4>Diff</h4>
              <pre className="detail-panel__diff">{detail.diff || '(no changes)'}</pre>
            </>
          )}

          <h4>Decisions</h4>
          <ul className="detail-panel__list">
            {detail.decisions.map((d) => (
              <li key={d.id}>
                [tick {d.tick}] {d.kind}: {JSON.stringify(d.detail)}
              </li>
            ))}
          </ul>

          <h4>Messages</h4>
          <ul className="detail-panel__list">
            {detail.messages.map((m) => (
              <li key={m.id}>
                [tick {m.tick}] {m.fromAgentId} → {m.toAgentId ?? 'everyone'}: {JSON.stringify(m.payload)}
              </li>
            ))}
          </ul>

          {detail.task.status === 'awaiting_review' && (
            <div className="detail-panel__actions">
              <button disabled={busy} onClick={approve} className="btn btn--approve">
                Approve
              </button>
              <input
                placeholder="Rejection feedback…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="detail-panel__feedback-input"
              />
              <button disabled={busy} onClick={reject} className="btn btn--reject">
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
