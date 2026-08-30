import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ProviderAdapter } from './provider-adapter.js';

// Ollama exposes an OpenAI-compatible /v1 endpoint, so no dedicated
// @ai-sdk/ollama package is needed — createOpenAICompatible covers it.
const ollama = createOpenAICompatible({
  name: 'ollama',
  baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
});

export const ollamaAdapter: ProviderAdapter = {
  id: 'ollama',
  model: (modelId: string) => ollama(modelId),
};
