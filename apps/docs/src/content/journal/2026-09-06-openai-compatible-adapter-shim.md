---
title: 'Adding a new LLM provider without writing a new SDK client'
date: 2026-09-06
tags: ['ai', 'node']
entryId: '2026-09-06-openai-compatible-adapter-shim'
---

<p>Adding NVIDIA NIM and SambaNova to the provider roster
      (<code>nvidia-nim-adapter.ts</code>, <code>sambanova-adapter.ts</code>) took about ten
      lines each, not because those providers are simple, but because neither needed its own
      SDK. Both — like <code>glm-adapter.ts</code>, <code>openrouter-adapter.ts</code>, and
      <code>ollama-adapter.ts</code> before them — just point the Vercel AI SDK's
      <code>createOpenAICompatible</code> at a base URL and an API key:</p>

```ts
const nvidiaNim = createOpenAICompatible({
  name: 'nvidia-nim',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
});
```

<p>This works because most hosted-inference providers converged on the same wire format
      OpenAI's chat-completions API popularized — same request shape, same streaming
      event format — even when the model behind it is Llama or DeepSeek, not GPT anything.
      <code>createOpenAICompatible</code> is a generic client for that de-facto protocol, so
      "add a provider" becomes a config object instead of a bespoke integration, and every
      adapter in <code>provider-registry.ts</code> ends up satisfying the same
      <code>ProviderAdapter</code> interface (<code>id</code> + <code>model(modelId)</code>)
      regardless of which vendor is actually behind it — the rest of the codebase never has
      to know the difference.</p>
      <p>The trade-off worth noting for next time: "wired" and "verified" are different claims.
      The nvidia adapter's own comment is explicit that its base URL and rate limits came from
      docs, not a live call — worth flagging in code whenever a new integration is added by
      research rather than by testing against a real key.</p>
