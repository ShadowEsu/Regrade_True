import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via the DISABLE_HMR env var; file watching
    // is also disabled there to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Proxy API calls to the Express backend (`npm run dev` in /server on port 8787).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '') || '/',
      },
    },
  },
});
