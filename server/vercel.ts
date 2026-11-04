/** Vercel serverless entry: the whole /api is one function (bundled by scripts/vercel-output.mjs). */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp, ready } from './app.ts';

process.env.NODE_ENV ??= 'production';
const app = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // The route config rewrites /api/<path> to /api?__p=<path>; restore the original path for Express.
  const url = new URL(req.url ?? '/', 'http://localhost');
  const p = url.searchParams.get('__p');
  if (p !== null) {
    url.searchParams.delete('__p');
    req.url = `/api/${p}${url.search}`;
  }
  await ready;
  app(req as never, res as never);
}
