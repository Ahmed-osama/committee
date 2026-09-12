---
title: 'Reopening a finished loop: scope "did we already agree" to the new round'
date: 2026-09-06
tags: ['ai', 'architecture']
entryId: '2026-09-06-stale-agreement-window-scoping'
---

<p>The web viewer's "regenerate" flow reopens a finalized planning conversation
      with fresh human feedback by calling <code>runPlanningSession</code> again, seeded
      with the old transcript via new <code>initialTranscript</code>/<code>startTurn</code>
      options in <code>packages/core/src/conversation/planning-session.ts</code>. That
      seeding created a subtle bug: the skeptic's earlier <code>agree</code> message from
      *before* the human's new feedback was still sitting in the transcript, and
      <code>hasSkepticAgreed</code>/<code>countSkepticChallenges</code> would see it and let
      the finalizer close the loop again immediately — with zero new debate on the thing
      the human just asked to change.</p>
      <p>The fix is a one-line filter: <code>const currentRound = transcript.filter((m) =&gt;
      m.turn &gt;= startTurn)</code>, and every agreement/challenge check reads from
      <code>currentRound</code> instead of the full transcript. The general shape — "carry
      history forward for context, but scope the *decision* state to what's happened since
      this resumption" — comes up anywhere a stateful loop gets restarted with prior
      history attached: a chat session resumed with old messages, a retry loop that reuses
      a previous attempt's log. The seeded history should inform the prompt; it shouldn't
      count as evidence toward exit conditions that are supposed to reflect fresh work.</p>
