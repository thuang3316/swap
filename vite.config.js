import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Isolate the framework into a stable `vendor` chunk so app-code edits
        // don't bust its long-lived browser cache across deploys. Scoped to the
        // framework ONLY — not all of node_modules — so @vercel/blob stays in the
        // lazy Create chunk instead of being pulled back into the initial load.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    // Forward API calls to the local Express dev server (server/dev.js).
    // In production on Vercel, /api/* is served by api/index.js instead.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    // `vite preview` serves the production build (used for perf measurement).
    // It doesn't inherit `server.proxy`, so forward /api to the local dev API
    // too. Local-only — has no effect on the Vercel build/deploy.
    proxy: {
      '/api': 'http://localhost:3001',
    },
    // Mirror the production security headers (set by Vercel in vercel.json) so
    // `npm run preview` exercises the real CSP and we can catch policy breakage
    // (blocked fonts/images/scripts) before deploying. KEEP THIS CSP IN SYNC
    // with the Content-Security-Policy in vercel.json. NOT applied to the dev
    // server (`server`) on purpose — a strict CSP would block Vite/React HMR.
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com; connect-src 'self'; form-action 'self'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
