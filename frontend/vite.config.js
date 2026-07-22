import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to Django — cookies work because it's same-origin
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Split vendor libraries into their own chunk so the browser can cache
    // React/Router/etc. across deploys — only the app-code chunk changes
    // (and needs re-downloading) when you ship a feature update.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':      ['lucide-react', 'react-hot-toast'],
          'vendor-motion':  ['framer-motion'],
        },
      },
    },
    // Surface a warning if any chunk balloons unexpectedly instead of
    // silently shipping a huge bundle
    chunkSizeWarningLimit: 600,
  },
})
