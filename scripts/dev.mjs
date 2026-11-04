// Runs the API server (auto-restarts on change) and the Vite dev server together.
import { spawn } from 'node:child_process';

const NODE_FLAGS = ['--disable-warning=ExperimentalWarning'];
const procs = [
  // the API always uses 8787 in dev (Vite proxies /api to it), whatever PORT the environment sets for Vite
  spawn(process.execPath, [...NODE_FLAGS, '--watch', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.API_PORT ?? '8787' },
  }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit' }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => (stop(), process.exit(code ?? 0))));
