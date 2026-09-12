---
title: 'Onboarding a new LLM provider: generic OpenAI-compatible shim vs. a dedicated SDK package'
date: 2026-09-13
tags: ['ai', 'node']
entryId: '2026-09-13-openai-compatible-vs-dedicated-sdk'
---

<p>Adding Cerebras and Mistral to <code>packages/core/src/provider/provider-registry.ts</code>
      used two different integration shapes for the same job — turning a provider into a
      <code>ProviderAdapter</code>. <code>cerebras-adapter.ts</code> wraps
      <code>createOpenAICompatible</code> from <code>@ai-sdk/openai-compatible</code>, pointing it
      at Cerebras's own base URL — the same approach already used for sambanova and nvidia-nim.
      <code>mistral-adapter.ts</code> instead pulls in Mistral's own <code>@ai-sdk/mistral</code>
      package and calls <code>createMistral({})</code>. Both end up satisfying the same
      <code>model: (modelId) =&gt; LanguageModel</code> interface, but they aren't interchangeable
      by default — the generic shim only works because a provider chose to expose an
      OpenAI-shaped <code>/chat/completions</code> endpoint; a provider with its own request/response
      quirks (different tool-calling format, different streaming envelope, provider-specific
      params) needs an SDK that speaks its actual protocol, which is what the Vercel AI SDK's
      first-party provider packages exist for.</p>
      <p>The practical rule this suggests: reach for <code>createOpenAICompatible</code> first
      since it needs zero new dependencies, but check whether the vendor publishes an
      <code>@ai-sdk/&lt;name&gt;</code> package before assuming the generic shim is safe long-term —
      if one exists, it usually means the API has enough divergence from strict OpenAI shape
      that edge cases (structured output, tool calls, stop reasons) will eventually surface
      through the generic wrapper. Also worth noting: <code>createMistral({})</code> takes no
      explicit <code>apiKey</code> because the AI SDK's provider packages fall back to reading a
      provider's conventional env var (<code>MISTRAL_API_KEY</code>) automatically — the
      openai-compatible shim has no such convention to lean on, so it always needs the key
      passed explicitly.</p>
      <div class="reading">
        <span class="label">Further reading</span>
        <ul><li>Vercel AI SDK docs, "Providers and Models" — the OpenAI-compatible provider
        section explains exactly when a custom-baseURL shim is enough vs. when you need a
        dedicated provider package.</li></ul>
      </div>
