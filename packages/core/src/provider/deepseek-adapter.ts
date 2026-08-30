import { createDeepSeek } from '@ai-sdk/deepseek';
import type { ProviderAdapter } from './provider-adapter.js';

// Reads DEEPSEEK_API_KEY from the environment automatically when omitted.
const deepseek = createDeepSeek({});

export const deepseekAdapter: ProviderAdapter = {
  id: 'deepseek',
  model: (modelId: string) => deepseek(modelId),
};
