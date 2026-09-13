---
title: 'Picking a DB driver from the connection string, not from `NODE_ENV`'
date: 2026-09-13
tags: ['architecture', 'node']
entryId: '2026-09-13-branching-on-connection-string-not-nodeenv'
---

<p><code>packages/db/src/client.ts</code> and <code>migrate.ts</code> needed to support two
      backends: Neon (SQL-over-HTTP/WebSocket, via <code>@neondatabase/serverless</code>) and a
      plain local Postgres for dev environments that can't reach Neon. The tempting shortcut is
      <code>if (process.env.NODE_ENV === 'development')</code>, but that's the wrong axis entirely
      — a Neon dev or preview branch is still a Neon host in every environment, and someone could
      just as easily point a "production" env var at a local database for testing. The actual
      question is "what protocol does the thing at the other end of <code>DATABASE_URL</code>
      speak," and the URL itself already answers that: the new <code>isLocalPostgres()</code>
      helper regex-matches <code>localhost</code>/<code>127.0.0.1</code> in the connection string
      and picks <code>drizzle-orm/node-postgres</code> (real wire-protocol Postgres via the
      <code>pg</code> package) over <code>drizzle-orm/neon-http</code> based on that, not on any
      environment flag.</p>
      <p>The general lesson: when code needs to behave differently depending on "which backend/
      service am I actually talking to," branch on a property of the connection target itself
      (its URL, host, protocol scheme) rather than on an environment label that's meant to answer
      a different question ("is this prod"). Environment and backend-identity are orthogonal axes
      that happen to correlate most of the time — which is exactly what makes conflating them a
      quiet source of bugs once someone breaks the correlation (a local Postgres in a "staging"
      env, a Neon branch used for a quick local test).</p>
