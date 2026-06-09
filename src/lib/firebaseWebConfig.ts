import type { FirebaseOptions } from 'firebase/app';

/**
 * Public Firebase Web SDK config for project `regrade-75d1a`.
 * These values are not secret — they ship in every production JS bundle.
 * Env vars (VITE_FIREBASE_*) override these when set at build time.
 */
export const PRODUCTION_FIREBASE_WEB: FirebaseOptions = {
  apiKey: 'AIzaSyD8gf1My5W6CmvLTiJsDB84JU01DCFfbGA',
  authDomain: 'regrade-75d1a.firebaseapp.com',
  projectId: 'regrade-75d1a',
  storageBucket: 'regrade-75d1a.firebasestorage.app',
  messagingSenderId: '255042840061',
  appId: '1:255042840061:web:f15d6d634048047d03a594',
  measurementId: 'G-KNLXX3ZS7P',
};

export function resolveFirebaseWebConfig(): FirebaseOptions {
  const fromEnv = (key: keyof ImportMetaEnv): string | undefined => {
    const v = import.meta.env[key];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };

  return {
    apiKey: fromEnv('VITE_FIREBASE_API_KEY') ?? PRODUCTION_FIREBASE_WEB.apiKey,
    authDomain: fromEnv('VITE_FIREBASE_AUTH_DOMAIN') ?? PRODUCTION_FIREBASE_WEB.authDomain,
    projectId: fromEnv('VITE_FIREBASE_PROJECT_ID') ?? PRODUCTION_FIREBASE_WEB.projectId,
    storageBucket: fromEnv('VITE_FIREBASE_STORAGE_BUCKET') ?? PRODUCTION_FIREBASE_WEB.storageBucket,
    messagingSenderId:
      fromEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') ?? PRODUCTION_FIREBASE_WEB.messagingSenderId,
    appId: fromEnv('VITE_FIREBASE_APP_ID') ?? PRODUCTION_FIREBASE_WEB.appId,
    measurementId: fromEnv('VITE_FIREBASE_MEASUREMENT_ID') ?? PRODUCTION_FIREBASE_WEB.measurementId,
  };
}

export function resolveFirestoreDatabaseId(): string {
  return import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.trim() || '(default)';
}
