---
title: 'Simulating a marketplace by calling its own HTTP routes, not seeding the database'
date: 2026-09-13
tags: ['testing', 'node']
entryId: '2026-09-13-simulate-through-real-routes-not-seeds'
---

<p><code>apps/web/scripts/simulate-groundtruth.ts</code> generates a whole population of
      GroundTruth listings, negotiations, and closed deals for testing the valuation engine and
      admin dashboard — but it never does <code>db.insert(listings).values(...)</code>. Instead
      every persona signs up through the real <code>/api/auth/otp/*</code> routes, submits real
      KYC, and posts listings/negotiation actions through the actual Server Action-backed API,
      using a real session cookie captured from each response. The one exception is a single
      read-only lookup (deal id by negotiation id) because the app itself doesn't expose that as
      JSON anywhere — everything that changes state goes through the same code path a real user's
      browser would hit.</p>
      <p>The reason this is worth the extra ceremony (OTP round-trips, cookie plumbing, an HMAC
      webhook signature built with <code>createHmac('sha256', ...)</code> to fake a Paymob
      callback) is that seeding rows directly only exercises your schema, not your business
      logic — a listing inserted straight into the table skips the KYC-gate check, the
      negotiation state machine's legal-transition rules, and the dual-confirmation logic in
      <code>closeDeal</code>. Any of those could be broken and a DB-seeded fixture would never
      notice, because it bypassed the code that would have caught it. Driving the same HTTP
      surface a real client uses means the simulation can't silently drift out of sync with what
      the app actually enforces — if a route's validation changes, the simulation breaks loudly
      instead of producing data the app would never have allowed to exist.</p>
