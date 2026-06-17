import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.regrade.client',
  appName: 'Regrade',
  /** Populated by `scripts/prepare-capacitor.mjs` — not raw `dist/`. */
  webDir: 'dist-capacitor',
  server: {
    // https://localhost is required for Firebase Auth redirects in the WebView.
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f4f6fb',
  },
};

export default config;
