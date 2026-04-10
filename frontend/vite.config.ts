import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-fast-marquee'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1024,
    modulePreload: {
      resolveDependencies: (_url, deps) =>
        deps.filter(
          (d) =>
            !/datepicker|phone|marquee|TrialSuccess|Admin|Cabinet|cabinet|Checkout|Signup|OnboardingPage|ConsultationModal/.test(
              d,
            ),
        ),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-router')) return 'router'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('scheduler') ||
            id.includes('react-helmet-async')
          ) return 'react-vendor'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('sonner')) return 'toast'
          if (id.includes('react-fast-marquee')) return 'marquee'
          if (id.includes('react-datepicker') || id.includes('date-fns')) return 'datepicker'
          if (id.includes('react-international-phone') || id.includes('country-flag-icons')) return 'phone'
          if (id.includes('motion') || id.includes('framer')) return 'motion'
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '/auth/google': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '^/site/': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '/content': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '/frontend': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '/bundles': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '/_widget': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '/seen_items': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '^/[a-z]{2}(?:-[A-Z]{2})?/(?:_widget|seen_items)(?:/|$)': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:9001',
        changeOrigin: true,
      },
      '/build-demo': {
        target: process.env.WIDGET_BUILDER_URL || 'http://127.0.0.1:3200',
        changeOrigin: true,
      },
      '/modules': {
        target: process.env.WIDGET_BUILDER_URL || 'http://127.0.0.1:3200',
        changeOrigin: true,
      },
      '/build': {
        target: process.env.WIDGET_BUILDER_URL || 'http://127.0.0.1:3200',
        changeOrigin: true,
      },
      '/deploy': {
        target: process.env.WIDGET_BUILDER_URL || 'http://127.0.0.1:3200',
        changeOrigin: true,
      },
    },
  },
})
