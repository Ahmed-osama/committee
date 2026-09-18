import type { TouchInput } from './touch-input.js';

export type RecordedInput =
  | { type: 'tap'; x: number; y: number }
  | {
      type: 'swipe';
      from: { x: number; y: number };
      to: { x: number; y: number };
      durationMs: number;
    };

// Records every call in memory instead of sending anything anywhere — lets the
// farming loop's tests assert exactly what input the bot decided to send, without a
// real HID device attached.
export class MockTouchInput implements TouchInput {
  readonly calls: RecordedInput[] = [];

  async tap(x: number, y: number): Promise<void> {
    this.calls.push({ type: 'tap', x, y });
  }

  async swipe(
    from: { x: number; y: number },
    to: { x: number; y: number },
    durationMs: number,
  ): Promise<void> {
    this.calls.push({ type: 'swipe', from, to, durationMs });
  }
}
