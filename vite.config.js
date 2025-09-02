import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Director/',
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['openai'],
          ui: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          utils: ['date-fns', 'fuse.js', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@dnd-kit/core', 'date-fns', 'zustand']
  }
})