/**
 * Local fallback for the first-run walkthrough. When the final step cannot be
 * persisted to the server (offline, expired session, permission denied), the
 * completion is remembered per account so the overlay never traps the user.
 * The server write is retried on the next launch.
 */
const PENDING_TUTORIAL_KEY = 'regrade:pendingTutorialComplete';

export function markPendingTutorialComplete(uid: string): void {
  try {
    window.localStorage.setItem(PENDING_TUTORIAL_KEY, uid);
  } catch {
    // Storage can be unavailable (private mode); the walkthrough simply shows again.
  }
}

export function hasPendingTutorialComplete(uid: string): boolean {
  try {
    return window.localStorage.getItem(PENDING_TUTORIAL_KEY) === uid;
  } catch {
    return false;
  }
}

export function clearPendingTutorialComplete(uid: string): void {
  try {
    if (window.localStorage.getItem(PENDING_TUTORIAL_KEY) === uid) {
      window.localStorage.removeItem(PENDING_TUTORIAL_KEY);
    }
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
