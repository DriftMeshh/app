import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts: merging vitest's `test` field into
// vite's own UserConfig type via `vitest/config`'s defineConfig hits a
// type collision when the project's own `vite` version and vitest's
// bundled `vite` dependency diverge (as they currently do). Splitting
// the configs avoids that entirely; vitest reads this file for test runs
// without vite.config.ts needing to know about `test` at all.
export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
})
