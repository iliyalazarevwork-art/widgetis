import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const widgetBuilderDir = resolve(import.meta.dirname);

export default defineConfig({
  testDir: widgetBuilderDir,
  testMatch: ['modules/**/fixture.spec.ts'],

  timeout: 30_000,
  workers: 4,

  webServer: {
    command: 'pnpm vite serve --config tests/fixtures/vite.config.ts --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  use: {
    headless: true,
    baseURL: 'http://localhost:5174',
    ...devices['Desktop Chrome'],
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: resolve(import.meta.dirname, 'tests/fixture-report') }],
  ],
});
