import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
  },
  resolve: {
    alias: {
      '@laxarevii/core': new URL('./packages/core/index.ts', import.meta.url).pathname,
    },
  },
});
