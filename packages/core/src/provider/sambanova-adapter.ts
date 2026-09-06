import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ProviderAdapter } from './provider-adapter.js';

// SambaNova Cloud exposes an OpenAI-compatible endpoint over its own
// dataflow-chip inference hardware — a second ultra-fast-inference provider
// alongside Groq. Base URL confirmed live (GET /v1/models with a real key
// returned the Meta-Llama-3.3-70B-Instruct id used below). Live-tested
// 2026-09-06: every model call, including this one, returned
// PAYMENT_METHOD_REQUIRED with balance_units: 0 — SambaNova now requires a
// card on file even to use free-tier quota, contradicting third-party
// "no credit card needed" writeups current as of the same date. Wired but
// unusable until a card is added at cloud.sambanova.ai/plans/billing.
const sambanova = createOpenAICompatible({
  name: 'sambanova',
  baseURL: 'https://api.sambanova.ai/v1',
  apiKey: process.env.SAMBANOVA_API_KEY,
});

export const sambanovaAdapter: ProviderAdapter = {
  id: 'sambanova',
  model: (modelId: string) => sambanova(modelId),
};
