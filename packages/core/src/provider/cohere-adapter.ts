import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ProviderAdapter } from './provider-adapter.js';

// Cohere issues a free Trial key on signup (no credit card) covering Command
// A/R/R+ — capped at 1,000 calls/month and 20 RPM, so treat this as a
// low-volume fallback seat rather than a primary. Trial keys are also
// explicitly barred from production/commercial use per Cohere's terms — fine
// for this project's own dev/planning use, not for anything shipped to
// GroundTruth's end users. Live-tested 2026-09-13 against the `/compatibility/v1`
// route specifically — Cohere's native `/v2/chat` is NOT OpenAI-shaped
// (no `/chat/completions` path, different response body) and returns 404
// under this adapter; the compatibility route is required.
const cohere = createOpenAICompatible({
  name: 'cohere',
  baseURL: 'https://api.cohere.com/compatibility/v1',
  apiKey: process.env.COHERE_API_KEY,
});

export const cohereAdapter: ProviderAdapter = {
  id: 'cohere',
  model: (modelId: string) => cohere(modelId),
};
