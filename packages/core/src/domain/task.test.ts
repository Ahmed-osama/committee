import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canTransition, transition, type Task, type TaskStatus } from './task.js';

function fakeTask(status: TaskStatus, overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    description: 'x',
    acceptanceCriteria: 'x',
    repoPath: '/tmp/x',
    baseBranch: 'main',
    status,
    retryCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const ALL_STATUSES: TaskStatus[] = [
  'pending',
  'claimed',
  'in_progress',
  'pending_auto_review',
  'awaiting_review',
  'approved',
  'rejected',
  'done',
];

test('the human-approval invariant: no status can reach done/approved except through awaiting_review -> approved', () => {
  for (const from of ALL_STATUSES) {
    if (from === 'awaiting_review') continue;
    assert.equal(canTransition(from, 'approved'), false, `${from} -> approved must be illegal`);
  }
  assert.equal(canTransition('awaiting_review', 'approved'), true);

  for (const from of ALL_STATUSES) {
    if (from === 'approved') continue;
    assert.equal(canTransition(from, 'done'), false, `${from} -> done must be illegal (only approved -> done)`);
  }
  assert.equal(canTransition('approved', 'done'), true);
});

test('the reviewer inbox (pending_auto_review) can never reach approved directly — only forward to the human inbox or bounce back', () => {
  assert.equal(canTransition('pending_auto_review', 'awaiting_review'), true);
  assert.equal(canTransition('pending_auto_review', 'rejected'), true);
  assert.equal(canTransition('pending_auto_review', 'approved'), false);
  assert.equal(canTransition('pending_auto_review', 'done'), false);
});

test('in_progress cannot skip straight to done, approved, or the human inbox', () => {
  assert.equal(canTransition('in_progress', 'done'), false);
  assert.equal(canTransition('in_progress', 'approved'), false);
  assert.equal(canTransition('in_progress', 'awaiting_review'), false);
  assert.equal(canTransition('in_progress', 'pending_auto_review'), true);
});

test('transition() throws on an illegal move instead of silently applying it', () => {
  const task = fakeTask('in_progress');
  assert.throws(() => transition(task, 'done'), /Illegal task transition/);
});

test('rejected is a dead end unless explicitly retried back to in_progress', () => {
  assert.equal(canTransition('rejected', 'in_progress'), true);
  assert.equal(canTransition('rejected', 'approved'), false);
  assert.equal(canTransition('rejected', 'done'), false);
});
