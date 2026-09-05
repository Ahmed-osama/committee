# apps/digest

Give it a topic, one LLM agent writes a short digest, saved to a local history
(`digest-history.json`, gitignored). This is the launchpad initiative's second real app —
deliberately not another planning-committee clone (no debate loop, no execution tools) —
built against unmodified `packages/core` to see what actually reuses cleanly across a
different kind of app. See `./FRICTION.md` for what didn't.

```
pnpm --filter @committee/digest start "the history of tea"
```
