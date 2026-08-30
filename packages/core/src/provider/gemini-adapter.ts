import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { ProviderAdapter } from './provider-adapter.js';

// Reads GOOGLE_GENERATIVE_AI_API_KEY from the environment automatically when omitted.
const google = createGoogleGenerativeAI({});

export const geminiAdapter: ProviderAdapter = {
  id: 'gemini',
  model: (modelId: string) => google(modelId),
};
