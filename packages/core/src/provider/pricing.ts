export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

// Anthropic prices verified against the live, authoritative model table
// (2026-08-30) — trust these. DeepSeek/GLM-4.5 prices came from third-party
// aggregator sites (not the providers' own pricing pages) since that's what
// was available, and DeepSeek in particular has since moved to peak/off-peak
// billing — treat these two as approximate and reverify before they matter
// for real money. Groq/Gemini are $0 because we only ever use their free
// tiers here — add a real price below if you start using a paid tier there.
// glm-4-flash is Zhipu's own free-tier model (per their published pricing
// page) — the default committee agents use this one, not the paid glm-4.5.
const PRICING: Record<string, ModelPricing> = {
  'anthropic:claude-sonnet-5': { inputPerMTok: 2, outputPerMTok: 10 },
  'anthropic:claude-haiku-4-5': { inputPerMTok: 1, outputPerMTok: 5 },
  'deepseek:deepseek-v4-flash': { inputPerMTok: 0.14, outputPerMTok: 0.28 },
  'glm:glm-4.5': { inputPerMTok: 0.6, outputPerMTok: 2.2 },
  'glm:glm-4-flash': { inputPerMTok: 0, outputPerMTok: 0 },
  // Perplexity has no free tier. This is an approximate figure for the base
  // 'sonar' model from public pricing pages, not independently re-verified
  // against Perplexity's own current docs the way the Anthropic prices
  // above were — reverify before this matters for real money. Perplexity
  // also bills a flat per-request fee on top of tokens (varies by search
  // context size) that isn't represented here at all.
  'perplexity:sonar': { inputPerMTok: 1, outputPerMTok: 1 },
};

const FREE: ModelPricing = { inputPerMTok: 0, outputPerMTok: 0 };
// openrouter is only free here because the default model id ends in
// `:free` — if you ever point an agent at a paid OpenRouter model, add its
// real price to PRICING above instead of relying on this blanket $0.
// sambanova/nvidia-nim are only free here because committee sticks to their
// free-tier model catalogs — add real pricing above if a paid model on
// either is ever used.
const FREE_PROVIDERS = new Set(['ollama', 'groq', 'gemini', 'openrouter', 'sambanova', 'nvidia-nim']);

export function computeCostUsd(providerId: string, modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[`${providerId}:${modelId}`] ?? (FREE_PROVIDERS.has(providerId) ? FREE : undefined);
  if (!pricing) {
    throw new Error(`No pricing configured for ${providerId}:${modelId} — add it to pricing.ts before using this model`);
  }
  return (inputTokens / 1_000_000) * pricing.inputPerMTok + (outputTokens / 1_000_000) * pricing.outputPerMTok;
}
