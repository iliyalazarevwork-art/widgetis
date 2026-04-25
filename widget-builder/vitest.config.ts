import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e.test.ts', '**/tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@laxarevii/core': new URL('./packages/core/index.ts', import.meta.url).pathname,
    },
  },
});
