import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseGitHubRemote } from './create-pr.js';

test('parses an https origin remote', () => {
  assert.deepEqual(parseGitHubRemote('https://github.com/acme/widgets.git'), { owner: 'acme', repo: 'widgets' });
  assert.deepEqual(parseGitHubRemote('https://github.com/acme/widgets'), { owner: 'acme', repo: 'widgets' });
});

test('parses an ssh origin remote', () => {
  assert.deepEqual(parseGitHubRemote('git@github.com:acme/widgets.git'), { owner: 'acme', repo: 'widgets' });
  assert.deepEqual(parseGitHubRemote('git@github.com:acme/widgets'), { owner: 'acme', repo: 'widgets' });
});

test('returns undefined for a non-GitHub remote instead of guessing', () => {
  assert.equal(parseGitHubRemote('https://gitlab.com/acme/widgets.git'), undefined);
  assert.equal(parseGitHubRemote('/local/path/to/repo'), undefined);
});
