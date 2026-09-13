---
title: "\"Done\" in the tracker isn't \"done\" in a browser"
date: 2026-09-14
tags: ['testing', 'frontend']
entryId: '2026-09-14-done-in-linear-isnt-done-in-a-browser'
---

GroundTruth's auth/KYC work (COM-18) and listings work (COM-17) were both marked Done
in Linear, and each piece checked out in isolation: the OTP flow worked, `/api/kyc/submit`
worked, listing creation worked once a seller was KYC-approved. What nobody had verified
was the seam between them — there was no actual page a real user could reach that carried
them from "just logged in" to "KYC approved," so listing creation was an unreachable dead
end for every real user despite every underlying piece being individually correct and
individually tested. Unit tests and `tsc --noEmit` can't catch this class of gap by
construction: each one only proves its own function or route works given the right inputs,
never that a human can actually reach that function through the UI.

The fix (`apps/web/e2e/kyc-unblocks-listing.spec.ts`, via a new Playwright setup at
`apps/web/playwright.config.ts`) is a single end-to-end test that drives a real browser
through the whole path — login OTP, hit the dead-end CTA, submit KYC, land back on a now-
unblocked listing form — specifically so this exact class of regression (individually-
"done" pieces with no connecting path) can't ship silently again. That's a different job
than a unit test: it's not there to pin down one function's behavior, it's there to encode
what "done" actually means for a multi-step user journey, as a single executable artifact
instead of a checklist someone has to remember to run by hand.

One small but real trap the test ran into: the KYC form's inputs aren't wired to their
`<label>`s via `htmlFor`, so Playwright's `getByLabel` would silently fail to match instead
of erroring loudly. The test falls back to `page.locator('input[name="..."]')` — a good
reminder that accessible-selector queries (`getByRole`, `getByLabel`) are only as reliable
as the markup's actual semantics, and a silent non-match in a test is worse than a loud one.

<div class="reading">
<span class="label">Further reading</span>
<ul><li>Kent C. Dodds, "Write tests. Not too many. Mostly integration." — the case for tests that exercise a real user path over a pile of isolated unit tests</li></ul>
</div>
</content>
