import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  define:
    mode === 'preview'
      ? { 'import.meta.env.VITE_PREVIEW_MODE': JSON.stringify('true') }
      : {},
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
  preview: {
    // Same proxy as dev so `npm run build && npm run preview` can call the local API.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '') || '/',
      },
    },
  },
}));
