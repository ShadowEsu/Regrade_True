import { describe, expect, it } from 'vitest';
import { strengthRating } from './VerdictReport';

describe('appeal strength rating', () => {
  it.each([
    ['no_case', 1],
    ['weak', 2],
    ['moderate', 3],
    ['strong', 5],
  ])('maps %s to %i of five', (strength, expected) => {
    expect(strengthRating(strength)).toBe(expected);
  });
});
