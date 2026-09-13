---
title: 'Deny by role, not by incidental exclusion'
date: 2026-09-14
tags: ['architecture', 'node']
entryId: '2026-09-14-deny-by-role-not-by-incidental-exclusion'
---

COM-35 added an `operator` session role (staff who place assisted orders for sellers
who can't use the app themselves) alongside the existing `user`/`admin` roles in
`apps/web/src/lib/auth/session.ts`. Operators should never be able to transact —
confirm a deal, open a negotiation, respond to one — on their own account's behalf.
It would have been tempting to skip an explicit check: an operator isn't a buyer or
seller on any listing, so the existing "are you a party to this deal?" check in each
route would reject them anyway, for free.

The routes (`api/deals/[id]/confirm`, `api/listings/[id]/negotiations`,
`api/negotiations/[id]/respond`) reject `session.role === 'operator'` outright,
before that party check ever runs. The reasoning in the comments is the lesson: that
rejection would have been *incidental* — a side effect of operators happening not to
own any deals — not a designed guarantee. Incidental protection breaks the moment the
coincidence stops holding: an operator whose `userId` ever matched a party field
through a future bug, a data migration, or a shared-identity feature would sail
straight through a party check that was never actually checking role. An explicit
role denylist at the top of the handler encodes the actual invariant ("operators
don't transact") as code, instead of leaving it as an emergent property of unrelated
logic that could stop being true without anyone noticing.

The general pattern: when a role's exclusion from an action is actually load-bearing
for security, write the check that says so directly, even if a different check
already happens to produce the same result today. Deny lists at the perimeter are
cheap; debugging why "impossible" access became possible after an unrelated schema
change is not.
