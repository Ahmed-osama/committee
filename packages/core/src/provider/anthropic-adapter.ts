import { createAnthropic } from '@ai-sdk/anthropic';
import type { ProviderAdapter } from './provider-adapter.js';

// Reads ANTHROPIC_API_KEY from the environment automatically when omitted.
const anthropic = createAnthropic({});

export const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  model: (modelId: string) => anthropic(modelId),
};
