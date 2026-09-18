import type { Frame, ScreenCapture } from './screen-capture.js';

// Used by the farming loop's own tests/dev runs until a real adapter exists. Cycles
// through a fixed, caller-provided sequence of frames (e.g. "empty patrol view",
// "mob detected", "unrecognized popup") so the loop's behavior is deterministic under
// test rather than depending on a live capture device. Repeats the last frame forever
// once the sequence is exhausted, so a test can assert steady-state behavior without
// having to supply an infinite list.
export class MockScreenCapture implements ScreenCapture {
  private index = 0;

  constructor(private readonly frames: Frame[]) {
    if (frames.length === 0) {
      throw new Error('MockScreenCapture needs at least one frame');
    }
  }

  async captureFrame(): Promise<Frame> {
    const frame = this.frames[Math.min(this.index, this.frames.length - 1)]!;
    this.index += 1;
    return frame;
  }
}
