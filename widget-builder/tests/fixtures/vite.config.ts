import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Root is widget-builder directory (parent of tests/)
const root = resolve(import.meta.dirname, '../..');

export default defineConfig({
  root,
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@laxarevii/core': resolve(root, 'packages/core/index.ts'),
    },
  },
});
