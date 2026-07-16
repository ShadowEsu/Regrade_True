import { describe, expect, it } from 'vitest';
import { INTRO_PLUS_TRIAL_MONTHS, PLAN_CATALOG } from './subscriptionService';

describe('release plan catalog', () => {
  it('uses the approved Free, Plus, and Pro limits and prices', () => {
    expect(PLAN_CATALOG).toMatchObject({
      free: { name: 'Free', price: 0, exams: 3, messages: 25, autoMode: false },
      student: { name: 'Plus', price: 6.99, exams: 10, messages: 50, autoMode: true },
      pro: { name: 'Pro', price: 11.99, exams: 20, messages: 100, autoMode: true },
    });
    expect(INTRO_PLUS_TRIAL_MONTHS).toBe(2);
  });
});
