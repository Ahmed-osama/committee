import type { Frame } from '../capture/screen-capture.js';

export type Match = {
  x: number;
  y: number;
  // 1.0 = pixel-perfect match, 0.0 = maximally different (see scoreAt's doc comment
  // for the actual metric).
  score: number;
};

// Naive brute-force template match: slides `template` over every position in `frame`
// and scores each by mean absolute pixel difference, normalized to a 0-1 similarity
// score. O(frame pixels * template pixels) — deliberately not an FFT-based or
// integral-image approach; this is a first-pass v1 (COM-... equivalent spike scope)
// meant to prove the detection concept against real captured frames before deciding
// whether performance actually needs a proper CV library once a real capture adapter
// exists. Revisit if a real frame's search takes too long for the farming loop's
// tick rate.
function scoreAt(frame: Frame, template: Frame, offsetX: number, offsetY: number): number {
  let totalDiff = 0;
  const pixelCount = template.width * template.height;
  for (let ty = 0; ty < template.height; ty++) {
    for (let tx = 0; tx < template.width; tx++) {
      const framePixel = frame.data[(offsetY + ty) * frame.width + (offsetX + tx)]!;
      const templatePixel = template.data[ty * template.width + tx]!;
      totalDiff += Math.abs(framePixel - templatePixel);
    }
  }
  const meanDiff = totalDiff / pixelCount;
  return 1 - meanDiff / 255;
}

// Returns the best-scoring position `template` matches within `frame`, or null if
// nothing clears `threshold` (0-1). A null result is exactly what should drive the
// bot's state machine into recovery_halt for an unrecognized screen — see
// bot/state-machine.ts.
export function findTemplate(frame: Frame, template: Frame, threshold: number): Match | null {
  if (template.width > frame.width || template.height > frame.height) {
    return null;
  }

  let best: Match | null = null;
  for (let y = 0; y <= frame.height - template.height; y++) {
    for (let x = 0; x <= frame.width - template.width; x++) {
      const score = scoreAt(frame, template, x, y);
      if (!best || score > best.score) {
        best = { x, y, score };
      }
    }
  }

  return best && best.score >= threshold ? best : null;
}
