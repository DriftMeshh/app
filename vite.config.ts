import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Avoids needing CORS middleware on the indexer for local dev — the
    // browser only ever talks to this origin, Vite forwards /api/* to
    // wherever the indexer is actually running.
    proxy: {
      '/api': {
        target: process.env.VITE_INDEXER_URL ?? 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
