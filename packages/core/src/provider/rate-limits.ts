export interface RateLimitConfig {
  /** Requests per minute. Undefined = no limit (e.g. local Ollama). */
  rpm?: number;
  /** Requests per day. Undefined = no limit. */
  rpd?: number;
}

// Seeded from each provider's published free-tier ceilings (verified
// 2026-08-30 — providers change these, so treat as a starting point, not
// gospel). Anthropic has no free-tier rate ceiling here since it's the paid
// provider — its usage is governed by the spend ceiling instead.
const PROVIDER_DEFAULTS: Record<string, RateLimitConfig> = {
  ollama: {},
  groq: { rpm: 30, rpd: 14_400 },
  gemini: { rpm: 10, rpd: 250 }, // conservative default matching Gemini 2.5 Flash
  anthropic: {},
  // OpenRouter's documented free-tier ceiling for accounts with no credit
  // purchase: 20 req/min, 50 req/day (rises to 1000/day once $10+ has ever
  // been purchased on the account) — verified against openrouter.ai/docs
  // 2026-08-31. Using the unpurchased-account default here.
  openrouter: { rpm: 20, rpd: 50 },
  // Perplexity has no free tier — usage is governed by the spend/call
  // ceilings instead, same as anthropic below.
  perplexity: {},
  // SambaNova's published free tier is a 200K-token/day-per-model cap plus
  // 20 req/min — this tracker only models request counts, not tokens, so
  // only the rpm half is represented here. Moot right now regardless: a
  // live-tested call 2026-09-06 hit PAYMENT_METHOD_REQUIRED on every model
  // (see sambanova-adapter.ts) — this account can't use SambaNova at all
  // until a card is on file.
  sambanova: { rpm: 20 },
  // NVIDIA NIM applies one global ~40 req/min ceiling per API key shared
  // across every model. Verified against NVIDIA's docs and third-party
  // aggregators 2026-09-06, not live-tested.
  'nvidia-nim': { rpm: 40 },
};

// Per-model overrides where a provider's tiers differ meaningfully.
const MODEL_OVERRIDES: Record<string, RateLimitConfig> = {
  'gemini:gemini-2.5-flash-lite': { rpm: 15, rpd: 1000 },
  'gemini:gemini-2.5-pro': { rpm: 5, rpd: 100 },
  // Observed live: Google returned a 429 RESOURCE_EXHAUSTED with
  // "limit: 20, model: gemini-3.6-flash" well before our generic 250/day
  // default would have blocked us — the free tier for this specific model
  // is much stricter than the flash-family default below.
  'gemini:gemini-3.6-flash': { rpm: 10, rpd: 20 },
};

export function getRateLimitConfig(providerId: string, modelId: string): RateLimitConfig {
  return MODEL_OVERRIDES[`${providerId}:${modelId}`] ?? PROVIDER_DEFAULTS[providerId] ?? {};
}
