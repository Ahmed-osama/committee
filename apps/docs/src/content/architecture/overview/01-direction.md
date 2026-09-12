---
title: 'Overview & direction'
order: 1
---

Earlier on, this project built a full bespoke task-tracking/execution
pipeline — a SQLite task state machine, git-worktree coding agents, a tick
scheduler. That direction was **abandoned on purpose**. What
the project is now: agents that _converse_ to plan, out loud, where
a human can watch and interject — with Linear as the task backend once
it's connected, not another home-grown PM app.
<div class="art">
<svg viewBox="0 0 480 240" width="480" height="240">
  <rect width="480" height="240" fill="#ffffff"/>
  <g transform="translate(80,120)">
    <circle cx="4" cy="6" r="42" fill="var(--coral-dk)"/>
    <circle r="42" fill="var(--coral)" stroke="var(--ink)" stroke-width="5"/>
    <g stroke="var(--ink)" stroke-width="5" stroke-linecap="round">
      <line x1="0" y1="-56" x2="0" y2="-42"/>
      <line x1="0" y1="56" x2="0" y2="42"/>
      <line x1="-56" y1="0" x2="-42" y2="0"/>
      <line x1="56" y1="0" x2="42" y2="0"/>
      <line x1="-40" y1="-40" x2="-30" y2="-30"/>
      <line x1="40" y1="-40" x2="30" y2="-30"/>
      <line x1="-40" y1="40" x2="-30" y2="30"/>
      <line x1="40" y1="40" x2="30" y2="30"/>
    </g>
    <ellipse cx="-14" cy="-20" rx="16" ry="9" fill="#ffffff" opacity="0.35" transform="rotate(-25 -14 -20)"/>
    <circle r="14" fill="#ffffff" stroke="var(--ink)" stroke-width="5"/>
    <line x1="-30" y1="-30" x2="30" y2="30" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
    <line x1="30" y1="-30" x2="-30" y2="30" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
  </g>
  <text x="80" y="195" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">TASK RUNNER</text>
  <path d="M138 120 H202" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
  <path d="M202 120 L186 109 M202 120 L186 131" stroke="var(--ink)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="315" cy="132" rx="72" ry="14" fill="var(--blue-dk)"/>
  <ellipse cx="315" cy="122" rx="72" ry="36" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
  <ellipse cx="292" cy="106" rx="26" ry="10" fill="#ffffff" opacity="0.3"/>
  <circle cx="6" cy="4" r="16" fill="var(--cream-dk)" transform="translate(315,72)"/>
  <circle cx="315" cy="72" r="16" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
  <circle cx="6" cy="4" r="16" fill="var(--cream-dk)" transform="translate(260,110)"/>
  <circle cx="260" cy="110" r="16" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
  <circle cx="6" cy="4" r="16" fill="var(--cream-dk)" transform="translate(370,110)"/>
  <circle cx="370" cy="110" r="16" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
  <path d="M311 87 q10 8 4 18" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <text x="315" y="205" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="14" fill="var(--ink)">PLANNING CONVERSATION</text>
  <rect x="424" y="82" width="34" height="52" rx="3" fill="var(--ink)" transform="translate(4,4)"/>
  <rect x="424" y="82" width="34" height="52" rx="3" fill="#ffffff" stroke="var(--ink)" stroke-width="4"/>
  <line x1="431" y1="96" x2="451" y2="96" stroke="var(--ink)" stroke-width="3"/>
  <line x1="431" y1="107" x2="451" y2="107" stroke="var(--ink)" stroke-width="3"/>
  <line x1="431" y1="118" x2="444" y2="118" stroke="var(--ink)" stroke-width="3"/>
  <text x="441" y="152" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">LINEAR</text>
</svg>
</div>
