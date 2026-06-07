import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { apiFetch } from '../lib/api';
import { APP_SUPPORT_EMAIL } from '../version';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { PREVIEW_USER_UID } from '../lib/previewFixtures';
import { userService } from './userService';
import { caseService } from './caseService';

async function deleteAccountClientSide(uid: string): Promise<void> {
  const casesQ = query(collection(db, 'cases'), where('userId', '==', uid));
  try {
    const snap = await getDocs(casesQ);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'cases');
    throw error;
  }

  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    throw error;
  }

  const user = auth.currentUser;
  if (user && user.uid === uid) {
    try {
      await deleteUser(user);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/requires-recent-login') {
        throw new Error(
          `For security, sign out, sign in again, then retry Delete Account — or email ${APP_SUPPORT_EMAIL}.`,
        );
      }
      throw err;
    }
  }
}

async function resetPreviewAccount(uid: string): Promise<void> {
  if (uid !== PREVIEW_USER_UID) return;
  userService.resetPreviewProfile(uid);
  await caseService.deleteAllUserCases(uid);
}

export const accountService = {
  /**
   * Permanently deletes the signed-in user's account, appeals, and profile.
   * Required for App Store and Google Play when accounts are offered.
   */
  async deleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to delete your account.');

    if (isPreviewMode()) {
      await resetPreviewAccount(user.uid);
      await signOut(auth);
      return;
    }

    try {
      const res = await apiFetch('/v1/account', { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Delete failed (${res.status})`);
      }
    } catch (apiErr) {
      console.warn('API account deletion unavailable, falling back to client delete:', apiErr);
      await deleteAccountClientSide(user.uid);
      return;
    }

    await signOut(auth);
  },
};
