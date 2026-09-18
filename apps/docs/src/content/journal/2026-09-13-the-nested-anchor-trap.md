---
title: 'The nested-anchor trap in card components'
date: 2026-09-13
tags: ['frontend', 'js']
entryId: '2026-09-13-the-nested-anchor-trap'
---

`ImageAttribution` (`apps/web/src/components/image-attribution.tsx`) renders a small
"photo by X · license" credit as a link back to the source. It's used standalone, but
also inside `ListingCard`, which wraps its whole thumbnail in an `<a>` to the listing
page. An `<a>` inside another `<a>` is invalid HTML — the spec forbids interactive
content nested inside interactive content — and browsers resolve it by silently
closing the outer tag early, which breaks the very link the card exists for. React
doesn't stop you from writing it, but hydration can warn or mismatch because the
server-rendered DOM tree the browser actually builds doesn't match the JSX you wrote.

The fix adds a `linked` prop that swaps the `<a>` for a plain `<span>` when the
component sits inside another link, keeping the same visual styling either way:

```tsx
export function ImageAttribution({
  credit,
  linked = true,
}: {
  credit: ImageCredit;
  linked?: boolean;
}) {
  if (!linked) return <span className={className}>{label}</span>;
  return (
    <a href={credit.sourceUrl} className={className}>
      {label}
    </a>
  );
}
```

The general lesson: whenever a small "leaf" component might render inside a link,
button, or label (all of which disallow certain nested interactive descendants),
give it an escape hatch rather than assuming it's always used at the top level. This
class of bug is easy to miss visually — the broken markup often still _looks_ right
in the browser — and only shows up as a click landing on the wrong target or a
hydration warning in the console.
</content>
