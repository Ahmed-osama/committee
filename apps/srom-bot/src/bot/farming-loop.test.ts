import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Frame } from '../capture/screen-capture.js';
import { MockScreenCapture } from '../capture/mock-screen-capture.js';
import { MockTouchInput } from '../input/mock-touch-input.js';
import { initialBotState } from './state-machine.js';
import { runFarmingLoopTick, type DetectionTemplate } from './farming-loop.js';

class RecordingAlertChannel {
  readonly messages: string[] = [];
  async notify(message: string): Promise<void> {
    this.messages.push(message);
  }
}

function frame(width: number, height: number, pixels: number[]): Frame {
  return { width, height, data: Uint8ClampedArray.from(pixels) };
}

const targetTemplate = frame(2, 2, [255, 255, 255, 255]);
const neutralTemplate = frame(1, 1, [128]);

const templates: DetectionTemplate[] = [
  { name: 'mob', kind: 'target', template: targetTemplate, threshold: 0.99 },
  { name: 'empty patrol view', kind: 'known_neutral', template: neutralTemplate, threshold: 0.99 },
];

test('taps the target and stays in patrol_loop when a target template matches', async () => {
  // prettier-ignore
  const sceneWithTarget = frame(4, 4, [
    128, 128, 128, 128,
    128, 128, 255, 255,
    128, 128, 255, 255,
    128, 128, 128, 128,
  ]);
  const capture = new MockScreenCapture([sceneWithTarget]);
  const input = new MockTouchInput();
  const alerts = new RecordingAlertChannel();

  const next = await runFarmingLoopTick({ capture, input, alerts, templates }, initialBotState);

  assert.equal(next.status, 'patrol_loop');
  assert.deepEqual(input.calls, [{ type: 'tap', x: 2, y: 1 }]);
  assert.deepEqual(alerts.messages, []);
});

test('does nothing but stays in patrol_loop on a recognized non-actionable screen', async () => {
  const emptyScene = frame(2, 2, [128, 128, 128, 128]);
  const capture = new MockScreenCapture([emptyScene]);
  const input = new MockTouchInput();
  const alerts = new RecordingAlertChannel();

  const next = await runFarmingLoopTick({ capture, input, alerts, templates }, initialBotState);

  assert.equal(next.status, 'patrol_loop');
  assert.deepEqual(input.calls, []);
  assert.deepEqual(alerts.messages, []);
});

test('halts and alerts when nothing recognized matches the frame', async () => {
  const unknownScene = frame(2, 2, [10, 20, 30, 40]);
  const capture = new MockScreenCapture([unknownScene]);
  const input = new MockTouchInput();
  const alerts = new RecordingAlertChannel();

  const next = await runFarmingLoopTick({ capture, input, alerts, templates }, initialBotState);

  assert.equal(next.status, 'recovery_halt');
  assert.deepEqual(input.calls, []);
  assert.equal(alerts.messages.length, 1);
});

test('a tick is a no-op once already halted — it never captures or acts', async () => {
  const capture = new MockScreenCapture([frame(2, 2, [255, 255, 255, 255])]);
  const input = new MockTouchInput();
  const alerts = new RecordingAlertChannel();
  const halted = { status: 'recovery_halt' as const, haltReason: 'disconnect' };

  const next = await runFarmingLoopTick({ capture, input, alerts, templates }, halted);

  assert.deepEqual(next, halted);
  assert.deepEqual(input.calls, []);
  assert.deepEqual(alerts.messages, []);
});
