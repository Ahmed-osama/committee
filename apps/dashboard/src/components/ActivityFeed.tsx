export interface ActivityEntry {
  id: string;
  text: string;
}

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="activity-feed">
      <h4>Activity</h4>
      <ul>
        {entries.length === 0 && <li className="activity-feed__empty">Nothing yet — waiting on the daemon.</li>}
        {entries.map((e) => (
          <li key={e.id}>{e.text}</li>
        ))}
      </ul>
    </div>
  );
}
