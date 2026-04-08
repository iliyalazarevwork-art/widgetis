import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const backendUrl = process.env.VITE_API_URL || 'http://localhost:9001'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/admin': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/livewire': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/css': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/js': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/favicon.ico': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
})
