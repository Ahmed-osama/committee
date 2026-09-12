---
title: 'A shell script is a stronger guardrail than a prompt instruction'
date: 2026-09-06
tags: ['ai', 'architecture']
entryId: '2026-09-06-deterministic-guardrail-vs-prompting'
---

<p>COM-9 added <code>packages/skills/hooks/validate-linear-spec.sh</code>, a
      <code>PreToolUse</code> hook wired in front of <code>mcp__linear__save_issue</code> and
      <code>mcp__linear__save_project</code>. It could have been "tell the agent in its system
      prompt not to file issues with an empty title" — but a system prompt is a request the
      model can still misread or skip under pressure from a long context. The hook instead runs
      as real code, outside the model's control: it reads the tool call's JSON off stdin, checks
      whether it's a create (no <code>id</code> field — updates like a bare status change are
      left alone) versus a genuinely empty <code>title</code>/<code>name</code>, and if so exits
      with code <code>2</code> and a JSON <code>permissionDecision: "deny"</code> payload that
      blocks the call outright before it ever reaches Linear.</p>
      <p>The general lesson: for a narrow, mechanically-checkable invariant ("this field must be
      non-empty"), a deterministic pre-tool hook is strictly more reliable than instructing the
      model to self-police, because it can't be rationalized away mid-conversation. Save prompt
      instructions for judgment calls — hooks for anything you can express as a plain boolean
      check on the tool call itself.</p>
