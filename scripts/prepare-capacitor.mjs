/**
 * Sanity check before `npx cap sync` and a friendly warning when the native
 * shell would boot without a reachable API. The old script also copied
 * dist → dist-capacitor and promoted app.html to index.html; that renaming is
 * gone now that the SPA lives at dist/index.html directly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = path.join(root, 'dist', 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('prepare-capacitor: dist/index.html missing — run `npm run build` first.');
  process.exit(1);
}

if (!process.env.VITE_API_BASE_URL?.trim()) {
  console.warn(
    '\n⚠️  VITE_API_BASE_URL is not set. The native app will boot, but AI analyze/advocate\n' +
      '   routes will fail until you rebuild with your deployed API URL, e.g.:\n' +
      '   VITE_API_BASE_URL=https://your-api.example.com npm run cap:sync\n',
  );
}

console.log('prepare-capacitor: dist/ ready for Capacitor.');
