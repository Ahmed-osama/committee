---
title: "Don't trust a free-tier claim until a real key completes a real call"
date: 2026-09-13
tags: ['ai']
entryId: '2026-09-13-verify-free-tier-with-a-real-call'
---

The provider-scout routine has now hit this three times: sambanova and cerebras both looked
like true no-card free tiers from third-party writeups and their own marketing pages, but
both return `PAYMENT_METHOD_REQUIRED` the moment a real key makes a real call. A GitHub
Models adapter was built and deleted the same day once live-testing showed GitHub had quietly
put the service into a "scheduled retirement brownout." Cohere's Trial key does work, but only
against `https://api.cohere.com/compatibility/v1` — its native `/v2/chat` route is not
OpenAI-shaped at all (different path, different response body) and 404s under an
OpenAI-compatible adapter, a detail no amount of reading the pricing page would surface.

The pattern underneath all three: a vendor's docs and third-party aggregator posts describe
the _intended_ offering, not the _current, enforced_ one — free-tier terms, deprecation
schedules, and route availability all drift faster than write-ups about them get updated, and
support docs occasionally just contradict what the API actually enforces. Static review (reading
the pricing page, checking `@ai-sdk/<name>` exists, matching outbound host to what the docs
show) can only ever produce a candidate integration, not a working one. Sending one real request
with a real key is the only step that distinguishes "should work per the docs" from "actually
works" — and it's cheap enough that it belongs before, not after, wiring a new adapter into
`PROVIDER_STRENGTH_ORDER`.

<div class="reading">
<span class="label">Further reading</span>
<ul><li>Hyrum's Law (as commonly cited in API-design writing) is the mirror-image version of this: an API's actual observable behavior becomes the real contract regardless of what the docs promise — true for your own APIs' consumers, and just as true when you're the consumer of someone else's.</li></ul>
</div>
