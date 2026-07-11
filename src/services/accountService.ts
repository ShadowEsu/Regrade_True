import { signOut } from 'firebase/auth';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { PREVIEW_USER_UID } from '../lib/previewFixtures';
import { userService } from './userService';
import { caseService } from './caseService';

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

    const res = await apiFetch('/v1/account', { method: 'DELETE' });
    if (!res.ok) {
      const payload = await res.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(payload?.error?.message ?? `Delete failed (${res.status}). No account data was changed.`);
    }

    await signOut(auth);
  },
};
