import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import {
  getRedirectResult,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { auth, appleProvider, googleProvider } from './firebase';

const BUNDLE_ID = 'app.regrade.client';

declare global {
  interface Window {
    regradeDesktop?: {
      isDesktop?: boolean;
      platform?: string;
    };
  }
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function isDesktopShell(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.regradeDesktop?.isDesktop) return true;
  return /\bElectron\b/i.test(navigator.userAgent);
}

function preferRedirectAuth(): boolean {
  return isNativeApp() || isDesktopShell();
}

function isRecoverablePopupError(error: unknown): boolean {
  const code = typeof (error as { code?: unknown })?.code === 'string' ? (error as { code: string }).code : '';
  return [
    'auth/popup-blocked',
    'auth/cancelled-popup-request',
    'auth/internal-error',
    'auth/web-storage-unsupported',
  ].includes(code);
}

/** Complete OAuth redirect after Google/Apple return to the app shell. */
export async function completeAuthRedirectIfNeeded(): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    if (import.meta.env.DEV) console.error('Auth redirect result failed', error);
    return null;
  }
}

export async function loginWithGoogle(): Promise<UserCredential | null> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  googleProvider.addScope('email');
  googleProvider.addScope('profile');

  if (preferRedirectAuth()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (!isRecoverablePopupError(error)) throw error;
    // Embedded browsers / blocked popups / hung passkey dialogs: fall back to full-page redirect.
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
}

/**
 * App Store Guideline 4.8 — native Sign in with Apple on iOS when Google is offered.
 * Uses AuthenticationServices via @capacitor-community/apple-sign-in, then Firebase.
 */
export async function loginWithApple(): Promise<UserCredential | null> {
  if (Capacitor.getPlatform() === 'ios') {
    const result = await SignInWithApple.authorize({
      clientId: BUNDLE_ID,
      redirectURI: 'https://app.regradeapp.tech/',
      scopes: 'email name',
    });
    const idToken = result.response?.identityToken;
    if (!idToken) {
      throw new Error('Apple sign-in did not return an identity token.');
    }
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken });
    return signInWithCredential(auth, credential);
  }
  if (preferRedirectAuth()) {
    await signInWithRedirect(auth, appleProvider);
    return null;
  }
  try {
    return await signInWithPopup(auth, appleProvider);
  } catch (error) {
    if (!isRecoverablePopupError(error)) throw error;
    await signInWithRedirect(auth, appleProvider);
    return null;
  }
}
