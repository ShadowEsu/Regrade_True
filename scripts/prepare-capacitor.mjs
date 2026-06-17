/**
 * Capacitor loads index.html from webDir — our React app lives in app.html.
 * Copy dist → dist-capacitor and promote app.html to index.html for native shells.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const capDir = path.join(root, 'dist-capacitor');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(dist)) {
  console.error('prepare-capacitor: run `npm run build` first (dist/ missing).');
  process.exit(1);
}

const appHtml = path.join(dist, 'app.html');
if (!fs.existsSync(appHtml)) {
  console.error('prepare-capacitor: dist/app.html missing — Vite app entry not built.');
  process.exit(1);
}

fs.rmSync(capDir, { recursive: true, force: true });
copyDir(dist, capDir);
fs.copyFileSync(appHtml, path.join(capDir, 'index.html'));

if (!process.env.VITE_API_BASE_URL?.trim()) {
  console.warn(
    '\n⚠️  VITE_API_BASE_URL is not set. The native app will boot, but AI analyze/advocate\n' +
      '   routes will fail until you rebuild with your deployed API URL, e.g.:\n' +
      '   VITE_API_BASE_URL=https://your-api.example.com npm run cap:sync\n',
  );
}

console.log('prepare-capacitor: dist-capacitor ready (app.html → index.html).');
