# apps/srom-bot

A personal-use bot that plays Silkroad Origin Mobile (SROM) on Ahmed's iPad while
he's away — grinding/farming, not a market product with an audience (see the plan's
"solo-use scope-keeper" seat: no multi-game abstraction, no config beyond what he
personally needs). Design finalized via `committee_plan` (5-seat custom roster, 56/70
turns) on the `srom-bot` branch.

## Core decisions from the plan (binding)

- **Platform**: a real iPad + an external HID device sending simulated touches (not
  jailbreak, not a Mac/emulator, not iOS Shortcuts) + computer-vision screen reading
  over a mirror/capture feed (not memory-reading — never touches the game's own
  process). HID input is indistinguishable from a finger at the input layer; CV never
  crosses the app sandbox. No existing public SROM bot (360auto, phBot's
  `sromc-plugin`) was found to run this way — they're Windows `.exe` tools that
  detect a PC/emulator game window, not real iPad hardware.
- **v1 scope**: a resource/mob farming loop only (fixed pathing + template matching).
  Questing and combat-assist are explicitly deferred until this proves reliable.
- **Fail-closed reliability**: `PATROL_LOOP` / `RECOVERY_HALT` — any unrecognized
  screen (disconnect, CAPTCHA, popup, a post-update UI) halts and alerts rather than
  guessing. Only an explicit operator action resumes it; it never auto-recovers.
- **Ban-risk posture**: fail-closed design + randomized session timing/length is the
  accepted mitigation — not deep anti-detection engineering. This is a real,
  accepted risk for a personal-use tool, not something being engineered away.

## Layout

- `src/capture/screen-capture.ts` — `ScreenCapture` interface + `Frame` (grayscale
  pixel buffer). `mock-screen-capture.ts` is the only implementation that exists
  today — a real adapter (AirPlay mirror capture, a USB capture card, etc.) is a
  sibling file once hardware is chosen. Same vendor-agnostic-interface pattern as
  `packages/auth-providers`/`packages/payment-providers`.
- `src/input/touch-input.ts` — `TouchInput` interface (`tap`/`swipe`).
  `mock-touch-input.ts` records calls in memory for tests; a real adapter (talking to
  a physical HID device, e.g. over serial) is a sibling file once hardware is chosen.
- `src/vision/template-match.ts` — `findTemplate`, a pure brute-force template
  matcher (mean-absolute-pixel-difference similarity). Deliberately naive (not FFT/
  integral-image-based) — a v1 spike to prove the detection concept; revisit if a
  real frame's search is too slow for the loop's tick rate once real capture exists.
  Exhaustively unit-tested against tiny synthetic frames, not real screenshots.
- `src/bot/state-machine.ts` — `applyBotEvent`, the pure fail-closed state machine
  above. Split from `farming-loop.ts` (capture/vision/input access) the same way
  `apps/web/src/lib/deals/confirmation.ts` splits pure merge logic from DB access, so
  the one rule that actually matters (never leave `recovery_halt` without a human) is
  cheap to unit test exhaustively.
- `src/bot/alert-channel.ts` — `AlertChannel` interface for the plan's heartbeat/
  push-alerting requirement. `console-alert-channel.ts` (logs to stdout) is the only
  adapter that exists today — not a substitute for a real push channel, since nothing
  wakes Ahmed up if the bot halts overnight while `console-alert-channel` is in use.
- `src/bot/farming-loop.ts` — `runFarmingLoopTick`, the orchestrator wiring capture +
  template matching + input + the state machine together for one tick. A
  `DetectionTemplate` is either `'target'` (tap it) or `'known_neutral'` (recognized,
  nothing to do); a frame matching neither drives `recovery_halt`.
- `src/index.ts` — currently a stub that exits non-zero explaining that no real
  adapters exist yet, rather than silently pretending to run. Replace once real
  `ScreenCapture`/`TouchInput`/`AlertChannel` adapters land: the real entry point is a
  scheduler calling `runFarmingLoopTick` on an interval, stopping the schedule on
  `recovery_halt` and resuming only on an explicit operator action — not built yet.

## Known gaps (deliberately out of this round's scope)

- No real capture/input/alert adapter — blocked on Ahmed actually choosing/acquiring
  hardware (a HID device, a capture/mirroring setup).
- No scheduler/runner wiring `runFarmingLoopTick` into an actual interval loop.
- No detection templates captured from the real game yet (`DetectionTemplate.template`
  needs real cropped screenshots of SROM's UI, not the synthetic tiny frames the unit
  tests use).
- No randomized multi-session scheduling (the plan's ban-risk mitigation) — a
  follow-up once the core loop is proven reliable.
