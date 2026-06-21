// Local development server ONLY. Vercel never runs this (it uses api/index.js).
// Vite proxies /api -> http://localhost:3001 during `npm run dev`.
import 'dotenv/config'; // load .env before anything reads process.env
import { createApp } from './app.js';

const port = process.env.PORT || 3001;
createApp().listen(port, () => {
  console.log(`[api] dev server listening on http://localhost:${port}`);
});
