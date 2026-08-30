import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { schedulerState } from '../schema.js';

const ROW_ID = 'global';

/** Advances and returns the persisted tick counter — continues across separate CLI invocations. */
export function nextTick(): number {
  const existing = db.select().from(schedulerState).where(eq(schedulerState.id, ROW_ID)).get();
  const next = (existing?.currentTick ?? -1) + 1;
  db.insert(schedulerState)
    .values({ id: ROW_ID, currentTick: next })
    .onConflictDoUpdate({ target: schedulerState.id, set: { currentTick: next } })
    .run();
  return next;
}

export function getCurrentTick(): number {
  return db.select().from(schedulerState).where(eq(schedulerState.id, ROW_ID)).get()?.currentTick ?? -1;
}
