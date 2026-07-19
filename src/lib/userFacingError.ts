const FRIENDLY_CODES: Record<string, string> = {
  'auth/email-already-in-use': 'An account already uses that email. Try signing in instead.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Regrade could not connect. Check your internet connection and try again.',
  'auth/operation-not-allowed': 'That sign-in option is not available yet.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for Regrade and try again, or continue with email.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. If Google asked for a passkey, choose Try another way and use your password.',
  'auth/cancelled-popup-request': 'Sign-in was interrupted. Try Google again, or continue with email.',
  'auth/unauthorized-domain': 'Google sign-in is not authorized for this Regrade address yet. Continue with email or contact Regrade support.',
  'auth/internal-error': 'Google sign-in could not start in this window. Continue with email and report the issue if it continues.',
  'auth/requires-recent-login': 'For security, sign out and sign back in before trying again.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/user-disabled': 'This account is unavailable. Contact Regrade support.',
  'auth/weak-password': 'Use a password with at least eight characters.',
  'permission-denied': 'Could not save your profile. Check your connection and try again.',
  unavailable: 'The service is temporarily unavailable. Try again shortly.',
};

export function userFacingError(error: unknown, fallback: string): string {
  const value = error as { code?: unknown; message?: unknown } | null;
  const code = typeof value?.code === 'string' ? value.code : '';
  if (FRIENDLY_CODES[code]) return FRIENDLY_CODES[code];
  const message = typeof value?.message === 'string' ? value.message : '';
  if (/offline|network|failed to fetch/i.test(message)) return 'Regrade could not connect. Check your internet connection and try again.';
  if (/timeout|timed out|aborted/i.test(message)) return 'The request took too long. Try again.';
  if (/permission|forbidden|unauthorized/i.test(message)) return 'You do not have permission to complete that action.';
  if (/cancelled|canceled/i.test(message)) return 'The action was cancelled.';
  return fallback;
}
