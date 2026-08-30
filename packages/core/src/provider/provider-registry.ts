import type { ProviderAdapter } from './provider-adapter.js';
import { ollamaAdapter } from './ollama-adapter.js';
import { groqAdapter } from './groq-adapter.js';
import { geminiAdapter } from './gemini-adapter.js';
import { anthropicAdapter } from './anthropic-adapter.js';
import { deepseekAdapter } from './deepseek-adapter.js';
import { glmAdapter } from './glm-adapter.js';

export const PROVIDER_REGISTRY: Record<string, ProviderAdapter> = {
  ollama: ollamaAdapter,
  groq: groqAdapter,
  gemini: geminiAdapter,
  anthropic: anthropicAdapter,
  deepseek: deepseekAdapter,
  glm: glmAdapter,
};

/** Ollama needs no key (it's local); the hosted providers need their API key set. */
export function isProviderConfigured(providerId: string): boolean {
  switch (providerId) {
    case 'ollama':
      return true;
    case 'groq':
      return !!process.env.GROQ_API_KEY;
    case 'gemini':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY;
    case 'glm':
      return !!process.env.GLM_API_KEY;
    default:
      return false;
  }
}
