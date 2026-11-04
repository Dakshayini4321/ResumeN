// Produces Vercel's Build Output (.vercel/output): the Vite app as static files + the API as one Node function.
// Runs automatically at the end of `npm run build` on Vercel (VERCEL=1); locally use `node scripts/vercel-output.mjs --force`.
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

if (!process.env.VERCEL && !process.argv.includes('--force')) process.exit(0);

const root = process.cwd();
const out = path.join(root, '.vercel', 'output');
fs.rmSync(out, { recursive: true, force: true });

// 1. static site
fs.cpSync(path.join(root, 'dist'), path.join(out, 'static'), { recursive: true });

// 2. API function
const fn = path.join(out, 'functions', 'api.func');
await build({
  entryPoints: [path.join(root, 'server', 'vercel.ts')],
  outfile: path.join(fn, 'index.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['node:sqlite', 'pg-native'],
  // CommonJS deps (express, pg) call require() for Node built-ins
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'warning',
});
fs.writeFileSync(
  path.join(fn, '.vc-config.json'),
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: 30 }, null, 2),
);

// 3. routing + security headers (same as the standalone server)
const security = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; '),
};
fs.writeFileSync(
  path.join(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '/api/(.*)', dest: '/api?__p=$1' },
        { src: '/assets/(.*)', headers: { 'Cache-Control': 'public, max-age=31536000, immutable', ...security }, continue: true },
        { src: '/(.*)', headers: security, continue: true },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html', headers: { 'Cache-Control': 'no-cache' } },
      ],
    },
    null,
    2,
  ),
);
console.log('Vercel build output written to .vercel/output');
