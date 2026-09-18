# srom-bot v1 spec (superseded — see note)

> **Status: superseded.** This is the design the committee finalized on 2026-09-18
> (conversation `4d210428-0cfd-4239-911a-a554db0c1dac`, 56 turns) — physical iPad +
> external HID device. Ahmed asked to pivot to a native Android app on 2026-09-19; a
> new committee round (conversation TBD) covers that pivot. Kept here verbatim as the
> record of *why* the original lane was chosen and rejected the alternatives it did —
> several of those arguments (emulator/root fingerprinting, fail-closed recovery,
> lure/potion/buff efficiency patterns) carry over to the Android pivot even though
> the hardware platform doesn't.

## Platform decision

Physical iPad + a Mac/Raspberry Pi acting as an HID controller (simulated touches,
indistinguishable from a finger at the input layer) + computer-vision screen reading
over a local screen mirror (AirPlay/Scrcpy-equivalent). Rejected alternatives:

- **Jailbreak + tweak** — rejected for maintenance burden across iOS/game updates.
- **iOS Shortcuts/Accessibility scripting** — rejected as insufficient for real-time
  combat-loop timing.
- **Android emulator (BlueStacks/LDPlayer) on PC/Mac** — proposed first (turn 1: "ADB
  gives us a real input/screenshot API instead of CV-on-a-mirrored-feed"), then
  reversed after the Account-Risk Skeptic's objection: mobile anti-cheat SDKs
  commonly ship cheap, first-class **emulator/root fingerprinting** (BlueStacks
  signatures, CPU arch mismatches, missing hardware sensors) as a detection layer. A
  genuine device running the genuine unmodified binary passes that *by construction*,
  pushing the whole detection problem onto fuzzier, more expensive behavioral
  signals. This is the strongest argument in the whole transcript and is why the
  Android pivot needs its own committee round rather than just swapping the adapter.

## Farming loop v1 scope

Fixed-waypoint patrol (4-8 hardcoded screen-relative waypoints for one known zone) →
CV template/color match on nameplate/HP-bar for mob detection → tap-to-target + fixed
attack-rotation macro (no reflex dodging — matches the HID/mirror latency budget) →
post-kill loot sweep → inventory-full/potion-low triggers a resupply macro (path to
NPC/return scroll → vendor/repair → path back to waypoint 0). Explicitly out of
scope: questing, combat-assist (reflex dodge/interrupt), multi-account, travel
between zones.

## State machine

Two states only: `PATROL_LOOP` (normal operation) and `RECOVERY_HALT`. Any
unrecognized screen — disconnect, CAPTCHA, popup, or a heartbeat signal present-but-
low-confidence (the signature of a patched UI, not just "absent") — halts input and
alerts rather than guessing or auto-retrying. Only a manual operator action resumes
`PATROL_LOOP`. Heartbeat signal list: HP bar visible, chat box unobstructed, target
reticle behaves as expected, no modal/popup present.

## Alerting

RECOVERY_HALT hits a free push service (ntfy.sh or Pushover) with a screenshot
attached — five lines of code, no dashboard, works from Ahmed's phone anywhere.

## Template versioning

Version-stamp the template/waypoint set. If match-confidence on heartbeat signals
drops below threshold for N consecutive cycles, that's a distinct RECOVERY_HALT alert
("possible game update, templates may need recapture") so a patch doesn't get
mistaken for a CAPTCHA or GM-whisper screen during debugging.

## Roadmap

1. Implement farming-loop v1, stabilize against real multi-day play data (no test
   environment exists for SROM's real servers — week one is data collection, not
   "done").
2. Multi-session scheduling: randomized start/stop times and session-length variance
   — flagged as a stronger, cheaper detection mitigation than any single input
   artifact, since a bot running identically 6am-6pm every day for a month is itself
   the strongest signal.
3. Combat-assist (reflex dodge/interrupt) — last priority, revisit only once v1's
   fixed-rotation loop proves the CV/HID pipeline solid over real multi-day runs; the
   latency budget can't cleanly support it otherwise.

## Changelog

- 2026-09-18: finalized by committee, conversation `4d210428-...`.
- 2026-09-19: superseded by an Android-native pivot (Ahmed's request) — see the new
  committee round for the current plan.
