/**
 * A local completion marker prevents an unavailable profile API from trapping
 * a signed-in person in setup. It is deliberately scoped to the Firebase uid
 * so one person's fallback never affects another account on the same device.
 */
const PENDING_ONBOARDING_KEY = 'regrade:pendingOnboardingComplete';

export function markPendingOnboardingComplete(uid: string): void {
  try {
    window.localStorage.setItem(PENDING_ONBOARDING_KEY, uid);
  } catch {
    // Storage can be unavailable in private browsing; setup remains retryable.
  }
}

export function hasPendingOnboardingComplete(uid: string): boolean {
  try {
    return window.localStorage.getItem(PENDING_ONBOARDING_KEY) === uid;
  } catch {
    return false;
  }
}

export function clearPendingOnboardingComplete(uid: string): void {
  try {
    if (window.localStorage.getItem(PENDING_ONBOARDING_KEY) === uid) {
      window.localStorage.removeItem(PENDING_ONBOARDING_KEY);
    }
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
