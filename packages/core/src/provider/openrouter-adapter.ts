import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ProviderAdapter } from './provider-adapter.js';

// OpenRouter exposes an OpenAI-compatible endpoint that fans out to many
// upstream providers/models — base URL verified against OpenRouter's own
// docs (openrouter.ai/docs). Live-tested 2026-08-31 with the free-tier
// `minimax/minimax-m3:free` model (see pricing.ts): responded correctly at
// $0 cost. `:free`-suffixed models share a rate-limited upstream pool, so
// expect occasional 429s under load.
const openrouter = createOpenAICompatible({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const openrouterAdapter: ProviderAdapter = {
  id: 'openrouter',
  model: (modelId: string) => openrouter(modelId),
};
