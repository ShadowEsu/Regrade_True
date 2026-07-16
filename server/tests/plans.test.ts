import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAN_CATALOG, PLAN_LIMITS } from '../src/billing.js';

test('server entitlements come from the approved shared plan catalog', () => {
  assert.equal(PLAN_CATALOG.trialMonths, 2);
  assert.deepEqual(PLAN_LIMITS, {
    free: { name: 'Free', monthlyPriceUsd: 0, exams: 3, messages: 25, autoMode: false },
    student: { name: 'Plus', monthlyPriceUsd: 6.99, exams: 10, messages: 50, autoMode: true },
    pro: { name: 'Pro', monthlyPriceUsd: 11.99, exams: 20, messages: 100, autoMode: true },
  });
});
