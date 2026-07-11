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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
          if (id.includes('/motion/') || id.includes('/framer-motion/')) return 'motion';
          if (id.includes('/lucide-react/')) return 'icons';
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react';
          return undefined;
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '') || '/',
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '') || '/',
      },
    },
  },
}));
