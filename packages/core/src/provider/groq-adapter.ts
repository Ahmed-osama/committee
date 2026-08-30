import { createGroq } from '@ai-sdk/groq';
import type { ProviderAdapter } from './provider-adapter.js';

// Reads GROQ_API_KEY from the environment automatically when omitted.
const groq = createGroq({});

export const groqAdapter: ProviderAdapter = {
  id: 'groq',
  model: (modelId: string) => groq(modelId),
};
