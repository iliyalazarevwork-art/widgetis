import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// Resolve the repo-relative widget-builder directory so testDir points at
// the modules root and testMatch globs inside it correctly.
const widgetBuilderDir = resolve(import.meta.dirname, '../..');

export default defineConfig({
  // testDir is the base for testMatch; point it at widget-builder root.
  testDir: widgetBuilderDir,

  // Discover all per-module e2e test files
  testMatch: ['modules/**/e2e.test.ts', 'modules/**/dom-check.spec.ts', 'tests/e2e/*.spec.ts'],

  globalSetup: resolve(import.meta.dirname, './global-setup.ts'),

  timeout: 60_000,
  workers: 2,

  use: {
    headless: true,
    ...devices['Desktop Chrome'],
    // Give pages time to load fully; real Horoshop stores can be slow
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Retry once on CI to handle transient network issues
  retries: process.env['CI'] ? 1 : 0,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: resolve(import.meta.dirname, './playwright-report') }],
  ],
});
