import { describe, expect, it } from 'vitest';
import { userFacingError } from './userFacingError';

describe('userFacingError', () => {
  it('maps authentication SDK codes to understandable messages', () => {
    expect(userFacingError({ code: 'auth/invalid-credential' }, 'fallback')).toBe('The email or password is incorrect.');
    expect(userFacingError({ code: 'auth/too-many-requests' }, 'fallback')).toContain('Wait a few minutes');
  });

  it('maps offline, timeout, and permission failures without leaking details', () => {
    expect(userFacingError(new Error('Failed to fetch https://private-host'), 'fallback')).not.toContain('private-host');
    expect(userFacingError(new Error('AbortError: request timed out'), 'fallback')).toContain('took too long');
    expect(userFacingError(new Error('FirebaseError: permission-denied /users/secret'), 'fallback')).not.toContain('/users/secret');
  });

  it('uses the caller fallback for unknown technical errors', () => {
    expect(userFacingError(new Error('SDK_INTERNAL_8391'), 'Try again.')).toBe('Try again.');
  });
});
