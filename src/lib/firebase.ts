import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import type { Auth, User } from 'firebase/auth';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
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
import { resolveFirebaseWebConfig, resolveFirestoreDatabaseId } from './firebaseWebConfig';

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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  const jsonError = JSON.stringify(errInfo);
  // Do not place user IDs, email addresses, document contents, or tokens in logs.
  if (import.meta.env.DEV) console.error('Firestore operation failed:', jsonError);
  throw new Error(jsonError);
}

const previewUser = {
  uid: PREVIEW_USER_UID,
  displayName: null,
  email: 'preview@regradeapp.tech',
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

let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;
let appleProvider: OAuthProvider;
let appCheck: AppCheck | null = null;

if (isPreviewMode()) {
  auth = buildPreviewAuth();
  db = {} as Firestore;
  googleProvider = {} as GoogleAuthProvider;
  appleProvider = {} as OAuthProvider;
} else {
  const firebaseWeb = resolveFirebaseWebConfig();
  const firestoreDatabaseId = resolveFirestoreDatabaseId();

  const app = initializeApp(firebaseWeb);
  const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY?.trim();
  if (appCheckSiteKey) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
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
  appCheck,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
};

export { loginWithGoogle, loginWithApple, completeAuthRedirectIfNeeded, isNativeApp } from './nativeAuth';
