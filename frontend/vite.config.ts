import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-fast-marquee'],
  },
  server: {
    port: 8000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://backend:80',
        changeOrigin: true,
      },
    },
  },
})
