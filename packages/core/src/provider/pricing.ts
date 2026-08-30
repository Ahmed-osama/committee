export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

// Anthropic prices verified against the live, authoritative model table
// (2026-08-30) — trust these. DeepSeek/GLM prices came from third-party
// aggregator sites (not the providers' own pricing pages) since that's what
// was available, and DeepSeek in particular has since moved to peak/off-peak
// billing — treat these two as approximate and reverify before they matter
// for real money. Groq/Gemini are $0 because we only ever use their free
// tiers here — add a real price below if you start using a paid tier there.
const PRICING: Record<string, ModelPricing> = {
  'anthropic:claude-sonnet-5': { inputPerMTok: 2, outputPerMTok: 10 },
  'anthropic:claude-haiku-4-5': { inputPerMTok: 1, outputPerMTok: 5 },
  'deepseek:deepseek-v4-flash': { inputPerMTok: 0.14, outputPerMTok: 0.28 },
  'glm:glm-4.5': { inputPerMTok: 0.6, outputPerMTok: 2.2 },
};

const FREE: ModelPricing = { inputPerMTok: 0, outputPerMTok: 0 };
const FREE_PROVIDERS = new Set(['ollama', 'groq', 'gemini']);

export function computeCostUsd(providerId: string, modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[`${providerId}:${modelId}`] ?? (FREE_PROVIDERS.has(providerId) ? FREE : undefined);
  if (!pricing) {
    throw new Error(`No pricing configured for ${providerId}:${modelId} — add it to pricing.ts before using this model`);
  }
  return (inputTokens / 1_000_000) * pricing.inputPerMTok + (outputTokens / 1_000_000) * pricing.outputPerMTok;
}
