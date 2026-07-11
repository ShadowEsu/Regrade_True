import { signOut } from 'firebase/auth';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';

/** Revokes server sessions before clearing the local Firebase session. */
export async function secureSignOut(): Promise<void> {
  if (!isPreviewMode() && auth.currentUser) {
    try {
      await apiFetch('/v1/session/logout', { method: 'POST' });
    } catch {
      // Local logout must remain available while offline. The existing ID token
      // still expires normally; online logout revokes it immediately.
    }
  }
  await signOut(auth);
}
