import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for Widgetis E2E.
 *
 * Two modes, switched via environment:
 *
 *   1. Local (default): hits http://127.0.0.1:5173, Playwright boots Vite via
 *      `webServer`. Uses the OTP dev bypass (master code 121212) on the local
 *      backend at :9001.
 *
 *   2. Prod smoke: when E2E_BASE_URL is set we point at the live URL and
 *      DISABLE the local web server. Only the `*prod-smoke*` specs are run
 *      (filter via `--grep prod-smoke` from the task).
 *
 * Chromium-only by design — fast install, fast run. Add other browsers when
 * a real cross-browser regression appears.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const isProdSmoke = !!process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  // Local mode runs everything EXCEPT prod-smoke (those need a live URL).
  // Prod-smoke mode runs ONLY prod-smoke specs.
  testMatch: isProdSmoke ? /prod-smoke\.spec\.ts$/ : /^(?!.*prod-smoke).*\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI || isProdSmoke ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: isProdSmoke
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 60_000,
      },
})
