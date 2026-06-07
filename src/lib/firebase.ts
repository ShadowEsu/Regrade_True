import type { FirebaseOptions } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { isPreviewMode } from './previewMode';
import { PREVIEW_USER_UID } from './previewFixtures';

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

const previewUser = {
  uid: PREVIEW_USER_UID,
  displayName: null,
  email: 'preview@regrade.app',
  emailVerified: true,
  photoURL: null,
  isAnonymous: false,
  providerData: [],
  metadata: {},
  providerId: 'preview',
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'preview-id-token',
  getIdTokenResult: async () =>
    ({
      token: 'preview-id-token',
      authTime: '',
      issuedAtTime: '',
      expirationTime: '',
      signInProvider: 'preview',
      signInSecondFactor: null,
      claims: {},
    }) as import('firebase/auth').IdTokenResult,
  reload: async () => {},
  toJSON: () => ({}),
} as unknown as User;

function buildPreviewAuth(): Auth {
  return {
    currentUser: previewUser,
    app: { name: '[preview]' },
    name: '[preview]',
    config: {},
    setPersistence: async () => {},
    languageCode: null,
    tenantId: null,
    settings: { appVerificationDisabledForTesting: false },
    updateCurrentUser: async () => {},
    signOut: async () => {},
    onAuthStateChanged: (nextOrObserver) => {
      const cb =
        typeof nextOrObserver === 'function'
          ? nextOrObserver
          : nextOrObserver.next?.bind(nextOrObserver);
      if (cb) queueMicrotask(() => cb(previewUser));
      return () => {};
    },
    onIdTokenChanged: (nextOrObserver) => {
      const cb =
        typeof nextOrObserver === 'function'
          ? nextOrObserver
          : nextOrObserver.next?.bind(nextOrObserver);
      if (cb) queueMicrotask(() => cb(previewUser));
      return () => {};
    },
  } as unknown as Auth;
}

function req(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name];
  if (typeof v !== 'string' || !String(v).trim()) {
    throw new Error(
      `Missing ${String(name)}. Copy .env.example to .env and set Firebase web config (see FIREBASE_SETUP.md), or run npm run dev:preview to browse without login.`,
    );
  }
  return String(v).trim();
}

let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;
let appleProvider: OAuthProvider;

if (isPreviewMode()) {
  auth = buildPreviewAuth();
  db = {} as Firestore;
  googleProvider = {} as GoogleAuthProvider;
  appleProvider = {} as OAuthProvider;
} else {
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
  auth = getAuth(app);
  db = getFirestore(app, firestoreDatabaseId);
  googleProvider = new GoogleAuthProvider();
  appleProvider = new OAuthProvider('apple.com');
  appleProvider.addScope('email');
  appleProvider.addScope('name');
}

export {
  auth,
  db,
  googleProvider,
  appleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
};

async function signInWithProviderPopup(provider: GoogleAuthProvider | OAuthProvider) {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : '';
    if (code !== 'auth/popup-closed-by-user') {
      console.error('Auth Error', error);
    }
    throw error;
  }
}

export const loginWithGoogle = async () => {
  if (isPreviewMode()) {
    throw new Error('Google sign-in is disabled in preview mode.');
  }
  return signInWithProviderPopup(googleProvider);
};

/** Required on iOS when Google sign-in is offered (App Store Guideline 4.8). */
export const loginWithApple = async () => {
  if (isPreviewMode()) {
    throw new Error('Sign in with Apple is disabled in preview mode.');
  }
  return signInWithProviderPopup(appleProvider);
};
