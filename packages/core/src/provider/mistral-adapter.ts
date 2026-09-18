import { createMistral } from '@ai-sdk/mistral';
import type { ProviderAdapter } from './provider-adapter.js';

// Reads MISTRAL_API_KEY from the environment automatically when omitted.
// Mistral's free "Experiment" tier needs no credit card and is a general-
// purpose (not speed-tier) seat, closer in strength to glm/deepseek than to
// groq/cerebras/sambanova. Not yet live-tested with a real key.
const mistral = createMistral({});

export const mistralAdapter: ProviderAdapter = {
  id: 'mistral',
  model: (modelId: string) => mistral(modelId),
};
