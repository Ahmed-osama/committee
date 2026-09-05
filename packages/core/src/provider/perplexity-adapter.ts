import { createPerplexity } from '@ai-sdk/perplexity';
import type { ProviderAdapter } from './provider-adapter.js';

// Reads PERPLEXITY_API_KEY from the environment automatically when omitted.
// Perplexity's models are search-augmented (they browse the live web before
// answering) — useful for a role that needs current facts, not just the
// model's training data. Unlike groq/gemini/openrouter's free tiers used
// elsewhere in this file, Perplexity has no free tier: every call costs
// real money against the account's credits.
const perplexity = createPerplexity({});

export const perplexityAdapter: ProviderAdapter = {
  id: 'perplexity',
  model: (modelId: string) => perplexity(modelId),
};
