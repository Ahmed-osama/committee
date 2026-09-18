---
title: 'Fail-closed farming loop'
order: 1
---

<p><code>apps/srom-bot</code> is a personal-use bot that plays Silkroad Origin Mobile
on Ahmed's own iPad while he's away — not a market product, just a scope-kept tool for
one person's farming grind. It drives a real iPad through an external HID device
sending simulated touches (indistinguishable from a finger at the input layer) and
reads the screen through computer-vision template matching over a mirror/capture feed
— it never reads the game's memory or crosses the app sandbox.</p>
<p>The one rule that actually matters is fail-closed reliability: every tick captures
a frame and checks it against known templates. A recognized target gets tapped: a
recognized-but-idle screen is left alone; anything unrecognized at all — a disconnect,
a CAPTCHA, a popup, a post-update UI the bot has never seen — halts the loop and
alerts Ahmed instead of guessing. Guessing under an MMO's anti-cheat is exactly the
kind of mechanically-wrong action that gets an account flagged, so <code>RECOVERY_HALT</code>
is a dead end on purpose: only an explicit operator-resume action gets the bot back
into <code>PATROL_LOOP</code>, it never recovers on its own.</p>
<p>The state machine (<code>state-machine.ts</code>) is pure and split out from the
orchestrator (<code>farming-loop.ts</code>) the same way this repo already splits pure
merge logic from DB access elsewhere, so the halt rule is cheap to unit-test
exhaustively. Today only mock capture/input/alert adapters exist — real hardware
(the HID device, a capture rig) hasn't been chosen yet, so <code>src/index.ts</code> is
a stub that refuses to run rather than pretending to.</p>

<div class="art">
<svg viewBox="0 0 460 240" width="460" height="240">
  <rect width="460" height="240" fill="#ffffff"/>
  <rect x="24" y="64" width="100" height="132" rx="14" fill="var(--blue-dk)" transform="translate(4,4)"/>
  <rect x="20" y="60" width="100" height="132" rx="14" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
  <rect x="28" y="70" width="30" height="12" rx="6" fill="#ffffff" opacity="0.35"/>
  <ellipse cx="70" cy="126" rx="26" ry="16" fill="#ffffff" stroke="var(--ink)" stroke-width="4"/>
  <circle cx="70" cy="126" r="8" fill="var(--ink)"/>
  <text x="70" y="176" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">IPAD + CV</text>
  <path d="M124 100 Q160 70 196 60" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <text x="150" y="55" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">TARGET</text>
  <path d="M124 130 Q160 158 196 176" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <text x="152" y="172" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">UNKNOWN</text>
  <circle cx="230" cy="46" r="30" fill="var(--green-dk)" transform="translate(3,3)"/>
  <circle cx="227" cy="43" r="30" fill="var(--green)" stroke="var(--ink)" stroke-width="5"/>
  <ellipse cx="216" cy="32" rx="8" ry="4" fill="#ffffff" opacity="0.4" transform="rotate(-20 216 32)"/>
  <text x="227" y="48" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">TAP</text>
  <rect x="200" y="160" width="70" height="52" rx="12" fill="var(--coral-dk)" transform="translate(4,4)"/>
  <rect x="196" y="156" width="70" height="52" rx="12" fill="var(--coral)" stroke="var(--ink)" stroke-width="5"/>
  <ellipse cx="208" cy="166" rx="10" ry="5" fill="#ffffff" opacity="0.4" transform="rotate(-20 208 166)"/>
  <text x="231" y="187" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">HALT</text>
  <path d="M266 182 Q310 182 340 160" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="2 9"/>
  <text x="320" y="150" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">ALERT</text>
  <circle cx="380" cy="130" r="22" fill="var(--cream-dk)" transform="translate(3,3)"/>
  <circle cx="377" cy="127" r="22" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
  <ellipse cx="368" cy="119" rx="6" ry="3" fill="#ffffff" opacity="0.4" transform="rotate(-20 368 119)"/>
  <rect x="362" y="152" width="30" height="34" rx="10" fill="var(--cream-dk)" transform="translate(3,3)"/>
  <rect x="359" y="149" width="30" height="34" rx="10" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
  <text x="377" y="200" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">OPERATOR</text>
  <path d="M359 120 Q260 40 124 108" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round" marker-end="url(#arrow)"/>
  <text x="250" y="26" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">EXPLICIT RESUME ONLY</text>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="var(--ink)"/>
    </marker>
  </defs>
</svg>
</div>
