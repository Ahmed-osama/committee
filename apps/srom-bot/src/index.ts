// No real ScreenCapture, TouchInput, or AlertChannel adapter exists yet — the
// committee_plan round picked the *approach* (external HID device + CV screen
// reading over a mirror/capture feed) but not the specific hardware, so there is
// nothing real to wire up here. Fail closed rather than pretending to run: see
// bot/state-machine.ts's recovery_halt philosophy, which this entry point follows
// too. Once real adapters land as sibling files in capture/ and input/, replace this
// with the actual scheduler loop (calling bot/farming-loop.ts's runFarmingLoopTick
// on an interval, stopping on recovery_halt, resuming only on an explicit operator
// action).
console.error(
  'srom-bot has no real capture/input/alert adapters wired up yet — nothing to run. ' +
    'See src/capture/screen-capture.ts, src/input/touch-input.ts, and ' +
    'src/bot/alert-channel.ts for the interfaces a real adapter needs to implement.',
);
process.exit(1);
