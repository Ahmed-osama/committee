import assert from 'node:assert/strict';
import { test } from 'node:test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../db.js';
import { createTask, retryTask, transitionTask } from './task-repo.js';

test.before(() => {
  migrate(db, { migrationsFolder: './drizzle' });
});

test('retryTask enforces the retry ceiling from the plan\'s safety invariants', () => {
  const t = createTask({ description: 'x', acceptanceCriteria: 'x', repoPath: '/tmp', baseBranch: 'main' });
  transitionTask(t.id, 'claimed');
  transitionTask(t.id, 'in_progress');

  for (let expected = 1; expected <= 3; expected++) {
    transitionTask(t.id, 'pending_auto_review');
    transitionTask(t.id, 'rejected');
    const retried = retryTask(t.id);
    assert.equal(retried.retryCount, expected);
    assert.equal(retried.status, 'in_progress');
  }

  transitionTask(t.id, 'pending_auto_review');
  transitionTask(t.id, 'rejected');
  assert.throws(() => retryTask(t.id), /retry ceiling/, 'a 4th retry must be refused, not silently allowed');
});

test('transitionTask refuses an illegal move even with a valid task id', () => {
  const t = createTask({ description: 'y', acceptanceCriteria: 'y', repoPath: '/tmp', baseBranch: 'main' });
  assert.throws(() => transitionTask(t.id, 'done'), /Illegal task transition/);
});
