/**
 * Google connection through the app's existing Firebase sign-in, so the
 * student sees the exact same Google popup they already use to log in.
 * No extra developer configuration is needed beyond the Firebase project.
 */

import {
  GoogleAuthProvider,
  linkWithPopup,
  reauthenticateWithPopup,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export interface GoogleGrant {
  accessToken: string;
  accountLabel: string | null;
}

function isCancel(err: unknown): boolean {
  const code = (err as { code?: string })?.code ?? '';
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/user-cancelled'
  );
}

export async function googlePortalLogin(scopes: string[]): Promise<GoogleGrant> {
  const provider = new GoogleAuthProvider();
  for (const scope of scopes) provider.addScope(scope);

  const user = auth.currentUser;
  const hasGoogle = Boolean(user?.providerData.some((p) => p.providerId === 'google.com'));

  let result: UserCredential;
  try {
    if (!user) {
      result = await signInWithPopup(auth, provider);
    } else if (hasGoogle) {
      result = await reauthenticateWithPopup(user, provider);
    } else {
      try {
        result = await linkWithPopup(user, provider);
      } catch (err) {
        const code = (err as { code?: string })?.code ?? '';
        if (code === 'auth/provider-already-linked' || code === 'auth/credential-already-in-use') {
          result = await reauthenticateWithPopup(user, provider);
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    throw new Error(isCancel(err) ? 'cancelled' : 'error');
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) throw new Error('error');
  return { accessToken, accountLabel: result.user.email ?? null };
}
