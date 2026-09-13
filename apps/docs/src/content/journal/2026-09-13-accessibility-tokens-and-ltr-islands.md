---
title: 'Baking accessibility into design tokens, not into each component'
date: 2026-09-13
tags: ['frontend']
entryId: '2026-09-13-accessibility-tokens-and-ltr-islands'
---

GroundTruth's audience skews older and less digitally literate (`docs/projects/groundtruth.md`), so
"make the tap targets bigger" and "make the text bigger" needed to be true everywhere, not just on
the screens someone remembered to check. `apps/web/tailwind.config.js` pushes both constraints into
the token layer itself: `fontSize.sm` starts at what most sites treat as their _base_ size, and a
new `spacing.tap` (`3.5rem` / 56px) token exists purely so every interactive control can reference
one name instead of each component picking its own height. `components/big-button.tsx` then hard-codes
`h-tap min-w-tap` into its `BASE` class string and explicitly comments that `variant` only ever changes
color weight, never size — there is no `size` prop to accidentally shrink a button on one screen.
The general move: when a constraint must hold everywhere (accessibility minimums, a brand rule, a
legal requirement), encode it as a token consumed by one shared primitive, not as a convention
developers are expected to remember to reapply per-component. A convention degrades one screen at a
time; a token degrades only if someone edits the token itself, which is a much easier thing to review
for.

A smaller but related detail showed up in `login-form.tsx`: the phone-number `<input>` gets
`dir="ltr"` explicitly, even though the whole page renders under `<html dir="rtl">` for the `ar`
locale (`apps/web/CLAUDE.md`'s RTL section). Digits are always read left-to-right regardless of the
surrounding script, so a phone/OTP input inheriting the page's RTL direction would visually reverse
digit order as you type — the fix isn't a global RTL/LTR toggle, just a one-off `dir` override on the
handful of fields whose content is inherently direction-fixed (phone numbers, numeric codes, often
URLs or code snippets). RTL support is usually not "flip everything," it's "flip everything except
the specific islands that are direction-invariant by nature."
