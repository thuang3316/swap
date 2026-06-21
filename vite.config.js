import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Forward API calls to the local Express dev server (server/dev.js).
    // In production on Vercel, /api/* is served by api/index.js instead.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
