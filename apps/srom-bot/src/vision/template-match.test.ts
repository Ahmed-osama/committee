import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Frame } from '../capture/screen-capture.js';
import { findTemplate } from './template-match.js';

function frame(width: number, height: number, pixels: number[]): Frame {
  assert.equal(pixels.length, width * height, 'fixture pixel count must match width*height');
  return { width, height, data: Uint8ClampedArray.from(pixels) };
}

test('finds an exact-match template at its true position', () => {
  // 4x4 frame, all 0 (black) except a 2x2 white (255) block at (2,1).
  // prettier-ignore
  const scene = frame(4, 4, [
    0, 0, 0, 0,
    0, 0, 255, 255,
    0, 0, 255, 255,
    0, 0, 0, 0,
  ]);
  const template = frame(2, 2, [255, 255, 255, 255]);

  const match = findTemplate(scene, template, 0.99);

  assert.ok(match);
  assert.equal(match.x, 2);
  assert.equal(match.y, 1);
  assert.equal(match.score, 1);
});

test('returns null when nothing in the frame clears the threshold', () => {
  const scene = frame(4, 4, new Array(16).fill(0));
  const template = frame(2, 2, [255, 255, 255, 255]);

  assert.equal(findTemplate(scene, template, 0.5), null);
});

test('returns null when the template is larger than the frame', () => {
  const scene = frame(2, 2, [0, 0, 0, 0]);
  const template = frame(4, 4, new Array(16).fill(255));

  assert.equal(findTemplate(scene, template, 0), null);
});

test('picks the best-scoring position when the template partially matches elsewhere too', () => {
  // A perfect match at (0,0) and a partial (noisy) match at (2,0) — the perfect one
  // must win even though both clear a low threshold.
  // prettier-ignore
  const scene = frame(4, 2, [
    255, 255, 200, 255,
    255, 255, 255, 200,
  ]);
  const template = frame(2, 2, [255, 255, 255, 255]);

  const match = findTemplate(scene, template, 0.5);

  assert.ok(match);
  assert.equal(match.x, 0);
  assert.equal(match.y, 0);
});
