import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // API server (server/index.ts) runs on 8787 in development
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: false } },
  },
});
