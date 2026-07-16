import assert from 'node:assert/strict';
import test from 'node:test';
import { ProfileSettingsSchema } from '../src/profile.js';

test('profile settings accept only the documented user-owned fields', () => {
  const parsed = ProfileSettingsSchema.parse({
    theme: 'system',
    autoMode: true,
    studyChecklist: ['Algebra', 'Units'],
    notificationPreferences: {
      imports: true,
      analysisComplete: true,
      possibleIssue: true,
      appealReady: false,
      parent: true,
      weeklySummary: false,
    },
  });
  assert.equal(parsed.autoMode, true);
});

test('profile settings reject ownership, entitlement, and timestamp injection', () => {
  for (const unsafe of [
    { uid: 'another-user' },
    { plan: 'pro' },
    { entitlement: 'unlimited' },
    { aiConsentAt: 'client-time' },
    { email: 'attacker@example.com' },
  ]) {
    assert.equal(ProfileSettingsSchema.safeParse(unsafe).success, false);
  }
});

test('profile settings constrain list sizes and connector identifiers', () => {
  assert.equal(ProfileSettingsSchema.safeParse({ preferredPlatform: 'unknown-lms' }).success, false);
  assert.equal(ProfileSettingsSchema.safeParse({ studyChecklist: Array.from({ length: 13 }, (_, i) => `item-${i}`) }).success, false);
  assert.equal(ProfileSettingsSchema.safeParse({}).success, false);
});
