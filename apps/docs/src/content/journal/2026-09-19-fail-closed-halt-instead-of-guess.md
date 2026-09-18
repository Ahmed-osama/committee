---
title: 'Fail-closed: halt on the unknown instead of guessing'
date: 2026-09-19
tags: ['architecture', 'testing']
entryId: '2026-09-19-fail-closed-halt-instead-of-guess'
---

`apps/srom-bot`'s state machine (`src/bot/state-machine.ts`) has exactly two states:
`PATROL_LOOP` and `RECOVERY_HALT`. Any frame the bot's vision layer can't match against
a known template — a disconnect, a CAPTCHA, a popup, a post-update UI it's never seen —
drives it straight into `RECOVERY_HALT`, and only an explicit `operator_resume` event
gets it back out. There's no "try the closest match," no timeout-based auto-retry, no
best-effort tap-and-hope. The alternative (keep tapping whatever looks closest to a
known target) sounds more resilient, but under an MMO's anti-cheat, a wrong guess isn't
a harmless no-op — it's exactly the kind of mechanically-off action that gets an account
flagged. When a wrong action is worse than no action, absence of certainty has to route
to a halt state, not to the best available guess.

This is the same shape as a circuit breaker or a schema validator that rejects unknown
fields instead of coercing them: the system enumerates what it positively recognizes as
safe, and treats everything outside that set as one bucket — "stop and ask a human" —
rather than trying to classify the unknown case correctly on the fly. The classification
effort goes into growing the known-safe set (more templates), not into handling the
unknown set more cleverly.

The other detail worth noting is where the boundary was drawn: `state-machine.ts`
exports a pure `applyBotEvent(state, event): state` function with no I/O, while
`farming-loop.ts` owns capture/vision/input and calls into it. That split means the one
invariant that actually matters here — "never leave `RECOVERY_HALT` without a human" —
gets exhaustively unit-tested against plain objects, no mocked camera or touch device
required. It's the same pure-core/imperative-shell split as `deals/confirmation.ts` in
the GroundTruth codebase (see `2026-09-14-deny-by-role-not-by-incidental-exclusion.md`'s
GroundTruth example) — pull the rule that must never break out of whatever talks to the
outside world, and it becomes cheap to test exhaustively instead of expensive to mock.

<div class="reading">
<span class="label">Further reading</span>
<ul><li>Release It! (Michael Nygard) — the circuit breaker pattern this halt state mirrors</li></ul>
</div>
