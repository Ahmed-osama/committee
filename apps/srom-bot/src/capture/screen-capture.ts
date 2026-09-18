// Vendor-agnostic capture interface — same pattern as packages/auth-providers and
// packages/payment-providers in this monorepo: code against this interface, not a
// specific capture mechanism, since the committee_plan round that designed this bot
// deliberately left the capture method (AirPlay mirror + a Mac, a USB capture card,
// something else) unresolved pending real hardware. A real adapter is a new sibling
// file implementing this interface once hardware is chosen — see mock-screen-capture.ts
// for the one that exists today.

export type Frame = {
  width: number;
  height: number;
  // Grayscale, row-major, one byte per pixel (0-255). Color is deliberately not
  // carried — SROM's UI elements (prompts, mob nameplates, the target reticle) are
  // distinguishable by shape/brightness, and dropping color keeps template-match.ts's
  // comparison cheap. Revisit if a real capture adapter's first template turns out to
  // need color to disambiguate two similar shapes.
  data: Uint8ClampedArray;
};

export interface ScreenCapture {
  captureFrame(): Promise<Frame>;
}
