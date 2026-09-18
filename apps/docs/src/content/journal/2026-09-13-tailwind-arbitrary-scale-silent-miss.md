---
title: "Tailwind utilities that don't exist just vanish, they don't error"
date: 2026-09-13
tags: ['frontend', 'js']
entryId: '2026-09-13-tailwind-arbitrary-scale-silent-miss'
---

A deal-feed icon on the GroundTruth homepage (`apps/web/src/app/(site)/[locale]/page.tsx`)
was sized with `h-8.5 w-8.5`, and the icon rendered at zero size instead of throwing a build
error or a lint warning. The class looked plausible — Tailwind's default spacing scale does
include some `.5` fractional steps (`0.5`, `1.5`, `2.5`, `3.5`) — but `8.5` was never one of
them, so the utility simply doesn't exist. Tailwind's JIT engine only emits CSS for class
names it recognizes from its scale or from actual arbitrary-value syntax; an unrecognized
plain class name is just inert text in the `className` string, with no error at any stage
(TypeScript, ESLint, or the Tailwind build) because to all of those tools it's a valid string.

The fix was switching to real arbitrary-value syntax, `h-[34px] w-[34px]`, which Tailwind
always honors regardless of the configured scale. The general lesson: when a Tailwind class
"does nothing," suspect first that it isn't a real utility rather than a CSS specificity or
ordering issue — check the scale (or just use bracket syntax) before debugging further up the
stack.

<div class="reading">
<span class="label">Further reading</span>
<ul><li>Tailwind CSS docs, "Adding Custom Styles" — the arbitrary values section covers exactly when bracket syntax is needed versus the default scale.</li></ul>
</div>
