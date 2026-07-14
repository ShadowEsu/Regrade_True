import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import type { Auth } from 'firebase/auth';
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

let appCheck: AppCheck | null = null;
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
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app, firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

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
