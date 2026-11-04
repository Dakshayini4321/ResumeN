/** Standalone server: `npm run dev` (API only, Vite serves the app) or `npm start` (API + built app). */
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';

const PROD = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
if (PROD) process.env.NODE_ENV = 'production';
const PORT = Number(process.env.PORT ?? 8787);

const { createApp, ready } = await import('./app.ts');
const app = createApp();

if (PROD) {
  const dist = path.resolve(import.meta.dirname, '..', 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('dist/ not found — run "npm run build" first.');
    process.exit(1);
  }
  app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true }));
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(dist, 'index.html'));
  });
}

await ready;
app.listen(PORT, () => console.log(`CVForge ${PROD ? 'server' : 'API'} listening on http://localhost:${PORT}`));
