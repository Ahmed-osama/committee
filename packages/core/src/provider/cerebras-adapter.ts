import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ProviderAdapter } from './provider-adapter.js';

// Cerebras Inference exposes an OpenAI-compatible endpoint over its wafer-scale
// chips — the fastest tokens/sec in the roster, positioned alongside
// groq/sambanova as a speed play. Free tier (~1M tokens/day, 30 RPM) needs no
// credit card per Cerebras's own docs as of 2026-09-13, though third-party
// aggregator writeups disagree with each other on whether that still holds —
// same stale-writeup risk that made sambanova unusable despite identical
// claims. Not yet live-tested with a real key.
const cerebras = createOpenAICompatible({
  name: 'cerebras',
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY,
});

export const cerebrasAdapter: ProviderAdapter = {
  id: 'cerebras',
  model: (modelId: string) => cerebras(modelId),
};
