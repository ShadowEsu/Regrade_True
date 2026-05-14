import type { FirebaseOptions } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function req(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name];
  if (typeof v !== 'string' || !String(v).trim()) {
    throw new Error(
      `Missing ${String(name)}. Copy .env.example to .env and set Firebase web config (see FIREBASE_SETUP.md).`,
    );
  }
  return String(v).trim();
}

const firebaseWeb: FirebaseOptions = {
  apiKey: req('VITE_FIREBASE_API_KEY'),
  authDomain: req('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: req('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: req('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: req('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: req('VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.trim() || '(default)';

const app = initializeApp(firebaseWeb);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * MANDATORY ERROR HANDLER: Provides context for permission failures.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  throw new Error(jsonError);
}

export const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : '';
    if (code !== 'auth/popup-closed-by-user') {
      console.error('Auth Error', error);
    }
    throw error;
  }
};
