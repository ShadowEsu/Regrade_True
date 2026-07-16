import assert from 'node:assert/strict';
import test from 'node:test';
import { rewardSummary } from '../src/billing.js';

test('reward progress earns five redeemable Plus days every thirty active days', () => {
  assert.deepEqual(rewardSummary({ activeDays: 29, currentStreak: 4 }), {
    activeDays: 29,
    currentStreak: 4,
    progressDays: 29,
    daysUntilReward: 1,
    earnedBlocks: 0,
    redeemedBlocks: 0,
    bonusDaysBalance: 0,
    rewardCycleDays: 30,
    rewardPlusDays: 5,
  });

  const sixtyDays = rewardSummary({ activeDays: 60, earnedBlocks: 2, bonusDaysBalance: 10 });
  assert.equal(sixtyDays.progressDays, 0);
  assert.equal(sixtyDays.earnedBlocks, 2);
  assert.equal(sixtyDays.bonusDaysBalance, 10);
  assert.equal(sixtyDays.rewardPlusDays, 5);
});

test('reward summary clamps corrupted negative counters', () => {
  const summary = rewardSummary({ activeDays: -9, currentStreak: -2, bonusDaysBalance: -5 });
  assert.equal(summary.activeDays, 0);
  assert.equal(summary.currentStreak, 0);
  assert.equal(summary.bonusDaysBalance, 0);
});
