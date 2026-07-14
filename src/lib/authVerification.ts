import type { User } from 'firebase/auth';

/** Email/password accounts must verify before using the app; OAuth providers are trusted. */
export function needsEmailVerification(user: User): boolean {
  // Local Vite/desktop testing should not trap on mailbox rate limits.
  if (import.meta.env.DEV) return false;
  if (user.emailVerified) return false;
  return user.providerData.some((p) => p.providerId === 'password');
}
