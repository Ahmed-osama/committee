import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ProviderAdapter } from './provider-adapter.js';

// NVIDIA NIM (build.nvidia.com) exposes an OpenAI-compatible endpoint that
// fans out to 100+ hosted models (Llama, Mistral, DeepSeek, Nemotron, ...)
// under one free developer-account key — the broadest single-provider
// catalog in the roster, useful as a diversity/fallback seat rather than a
// speed play. Base URL and free-tier ceiling (~40 req/min per key, no
// credit card required) verified against NVIDIA's own docs and third-party
// aggregators 2026-09-06 — not yet live-tested with a real key, unlike the
// other adapters in this file whose comments say so.
const nvidiaNim = createOpenAICompatible({
  name: 'nvidia-nim',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
});

export const nvidiaNimAdapter: ProviderAdapter = {
  id: 'nvidia-nim',
  model: (modelId: string) => nvidiaNim(modelId),
};
