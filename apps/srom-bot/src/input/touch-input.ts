// Vendor-agnostic input interface, same reasoning as capture/screen-capture.ts: the
// committee_plan round picked "an external HID device sending simulated touches" as
// the input mechanism (indistinguishable from a finger at the input layer, unlike an
// in-app injection API), but which physical device wasn't chosen yet. A real adapter
// (e.g. talking to a Teensy/Arduino over serial) is a new sibling file implementing
// this interface once hardware is chosen — see mock-touch-input.ts for the one that
// exists today.

export interface TouchInput {
  tap(x: number, y: number): Promise<void>;
  swipe(
    from: { x: number; y: number },
    to: { x: number; y: number },
    durationMs: number,
  ): Promise<void>;
}
