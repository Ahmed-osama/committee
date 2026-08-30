import type { Alert } from '../types.js';

export function AlertsBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="alerts-banner">
      {alerts.map((a) => (
        <div key={a.id} className="alerts-banner__item">
          ⚠ [{a.kind}] {a.message}
        </div>
      ))}
    </div>
  );
}
