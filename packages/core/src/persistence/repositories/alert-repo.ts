import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db.js';
import { alerts } from '../schema.js';

export type AlertKind = 'ceiling_hit' | 'retries_exhausted' | 'turn_error';

export interface Alert {
  id: string;
  kind: AlertKind;
  message: string;
  agentId?: string;
  taskId?: string;
  acknowledged: boolean;
  createdAt: string;
}

export function recordAlert(input: { kind: AlertKind; message: string; agentId?: string; taskId?: string }): void {
  db.insert(alerts)
    .values({ ...input, id: randomUUID(), acknowledged: false, createdAt: new Date().toISOString() })
    .run();
}

export function getUnacknowledgedAlerts(): Alert[] {
  return db.select().from(alerts).where(eq(alerts.acknowledged, false)).orderBy(desc(alerts.createdAt)).all() as Alert[];
}

export function acknowledgeAllAlerts(): void {
  db.update(alerts).set({ acknowledged: true }).where(eq(alerts.acknowledged, false)).run();
}
