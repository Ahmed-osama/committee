---
title: 'A stray NUL byte turns a text file into "binary" for git'
date: 2026-09-12
tags: ['js', 'node']
entryId: '2026-09-12-embedded-nul-byte-binary-diff'
---

<p>A composite-key template literal in <code>apps/web/src/lib/valuation/valuation.ts</code>
      used a real, literal NUL character as the delimiter between <code>zone</code>,
      <code>propertyType</code>, and <code>areaBand</code> — someone had typed (or an editor
      auto-inserted) the actual control character instead of the two-character escape
      sequence <code>\0</code>. The code still ran fine; JS strings don't care. But git does:
      it sniffs the first few thousand bytes of a file for a NUL byte as its heuristic for
      "this is binary," and once it decides that, every diff for the file collapses to an
      opaque <code>Bin 2433 -&gt; 2435 bytes</code> line — unreadable in review, and any tool
      that treats the file as binary (line-ending normalization, <code>grep</code> without
      <code>-a</code>, some diff/merge tools) starts behaving strangely around it.</p>
      <p>The fix was purely textual: replace the embedded byte with the escape sequence
      <code>\0</code> in source — identical runtime string, but now the file is unambiguously
      text again. The general lesson is to always write non-printable characters as escape
      sequences in source rather than the raw byte, even when a language's runtime treats
      them identically — the raw byte is invisible in an editor and in most diffs, so its
      presence tends to be discovered by tooling breakage long after the fact rather than by
      anyone noticing it at write time.</p>
