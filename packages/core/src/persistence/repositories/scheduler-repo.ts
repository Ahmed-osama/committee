import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { schedulerState } from '../schema.js';

const ROW_ID = 'global';

function ensureRow(): void {
  db.insert(schedulerState).values({ id: ROW_ID, currentTick: -1, paused: false }).onConflictDoNothing().run();
}

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

/**
 * The kill switch: a hard, externally-triggerable stop that doesn't depend
 * on any agent's own loop cooperating. Any process advancing ticks —
 * `committee tick`, the daemon, anything else later — checks this before
 * dispatching new work, so pausing is a hard stop regardless of which
 * command or process is driving the clock.
 */
export function pauseScheduler(): void {
  ensureRow();
  db.update(schedulerState).set({ paused: true }).where(eq(schedulerState.id, ROW_ID)).run();
}

export function resumeScheduler(): void {
  ensureRow();
  db.update(schedulerState).set({ paused: false }).where(eq(schedulerState.id, ROW_ID)).run();
}

export function isPaused(): boolean {
  return db.select().from(schedulerState).where(eq(schedulerState.id, ROW_ID)).get()?.paused ?? false;
}
