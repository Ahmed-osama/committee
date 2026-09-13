import { defineConfig } from '@playwright/test';

// One project (Chromium only) — this app is a phone-first MVP for a single audience,
// not a cross-browser compatibility target; add more projects if that ever changes.
// Reuses an already-running `pnpm dev` locally (see apps/web/CLAUDE.md's bundler-quirk
// note on why this app must run with --webpack) and always starts a fresh one in CI.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // Next dev compiles routes lazily on first request — a cold server can make the
  // first navigation/API call in a run noticeably slower than the 30s default.
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
