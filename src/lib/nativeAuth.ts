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
import { isPreviewMode } from './previewMode';

const BUNDLE_ID = 'app.regrade.client';

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Complete OAuth redirect when returning to the Capacitor WebView (Google on iOS/Android). */
export async function completeAuthRedirectIfNeeded(): Promise<UserCredential | null> {
  if (!isNativeApp()) return null;
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    console.error('Auth redirect result failed', error);
    return null;
  }
}

export async function loginWithGoogle(): Promise<UserCredential | null> {
  if (isPreviewMode()) {
    throw new Error('Google sign-in is disabled in preview mode.');
  }
  if (isNativeApp()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  return signInWithPopup(auth, googleProvider);
}

/**
 * App Store Guideline 4.8 — native Sign in with Apple on iOS when Google is offered.
 * Uses AuthenticationServices via @capacitor-community/apple-sign-in, then Firebase.
 */
export async function loginWithApple(): Promise<UserCredential | null> {
  if (isPreviewMode()) {
    throw new Error('Sign in with Apple is disabled in preview mode.');
  }
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
  if (isNativeApp()) {
    await signInWithRedirect(auth, appleProvider);
    return null;
  }
  return signInWithPopup(auth, appleProvider);
}
