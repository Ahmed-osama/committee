import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ProviderAdapter } from './provider-adapter.js';

// Zhipu AI / GLM exposes an OpenAI-compatible endpoint — verified base URL
// from Zhipu's own docs (docs.bigmodel.cn), not guessed. GLM_BASE_URL lets
// you switch to the international api.z.ai endpoint if that's where your
// key is from; its exact path wasn't confirmed, so it's not the default.
const glm = createOpenAICompatible({
  name: 'glm',
  baseURL: process.env.GLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: process.env.GLM_API_KEY,
});

export const glmAdapter: ProviderAdapter = {
  id: 'glm',
  model: (modelId: string) => glm(modelId),
};
