// Vercel serverless entry point. Vercel routes /api/* to this function.
// No app.listen() here — Vercel invokes the exported handler per request.
import { createApp } from '../server/app.js';

export default createApp();
