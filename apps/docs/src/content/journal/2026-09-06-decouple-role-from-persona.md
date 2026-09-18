---
title: 'Separating "what it does" from "what it''s called"'
date: 2026-09-06
tags: ['ai', 'architecture']
entryId: '2026-09-06-decouple-role-from-persona'
---

<p>The <code>committee_plan</code> MCP tool (<code>apps/mcp-server/src/index.ts</code>)
      used to seat a fixed six agents. The custom-roster addition lets a caller invent any
      seat titles and personas it wants ("Migration Skeptic", "Data Modeler") while still
      requiring each seat to declare one of a closed set of <code>role</code> values —
      <code>planner</code>, <code>architect</code>, <code>skeptic</code>, etc. That
      <code>role</code> is the only thing the round-robin loop actually reads to decide
      mechanics: which seats speak as challengers, and which single seat (a
      <code>skeptic</code>) gets veto power over finalizing the plan. <code>name</code> and
      <code>persona</code> are pure presentation, free-text, never inspected by the loop.</p>
      <p>This is the same split as an enum-tagged union in code: a small closed set drives
      control flow, and an open string field carries whatever detail doesn't affect behavior.
      It's what makes free-form LLM-generated input (the calling agent invents seat names on
      the fly) safe to mix with code that needs to make hard decisions — the loop never has to
      parse or trust the creative part, only the tagged part.</p>

```ts
role: z.enum(['planner', 'architect', 'skeptic', ...]) // drives finalization/challenger logic
name: z.string()     // cosmetic only
persona: z.string()  // cosmetic only, becomes the system prompt
```
