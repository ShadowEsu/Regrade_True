import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingOnboardingComplete,
  hasPendingOnboardingComplete,
  markPendingOnboardingComplete,
} from './onboardingCompletion';

describe('onboarding completion fallback', () => {
  beforeEach(() => window.localStorage.clear());

  it('remembers a pending completion only for the account that finished setup', () => {
    markPendingOnboardingComplete('uid-a');
    expect(hasPendingOnboardingComplete('uid-a')).toBe(true);
    expect(hasPendingOnboardingComplete('uid-b')).toBe(false);
  });

  it('clears the marker once the server confirms completion', () => {
    markPendingOnboardingComplete('uid-a');
    clearPendingOnboardingComplete('uid-a');
    expect(hasPendingOnboardingComplete('uid-a')).toBe(false);
  });
});
