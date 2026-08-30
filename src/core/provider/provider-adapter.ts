import type { LanguageModel } from 'ai';

/**
 * A provider is anything that can hand back a LanguageModel for a given
 * model id. Everything above this line (the agent loop) only ever talks
 * to this interface — it never imports @ai-sdk/anthropic, @ai-sdk/google,
 * etc. directly. That's what lets Phase 2 add three more providers
 * without touching the agent loop at all.
 */
export interface ProviderAdapter {
  id: string;
  model(modelId: string): LanguageModel;
}
