import { describe, expect, it } from 'vitest';
import type { Case } from '../services/caseService';
import { getPossiblePointsBack } from './appealHelpers';

function caseWithAnalysis(analysis: Record<string, unknown>): Case {
  return { analysis } as unknown as Case;
}

describe('getPossiblePointsBack', () => {
  it('never reports more points than the score can actually improve', () => {
    const result = getPossiblePointsBack(caseWithAnalysis({
      assignment: {
        total_score_earned: 89,
        total_score_possible: 100,
      },
      questions: [
        { question_id: 'q1', points_earned: 4, points_possible: 10 },
      ],
      case_analysis: {
        overall_case_strength: 'strong',
        unexplained_deductions: [
          { question_id: 'q1', points_lost: 41.5 },
        ],
        potential_calculation_errors: [
          { question_id: 'q1', expected_score: 10, actual_score_shown: 4 },
        ],
      },
    }));

    expect(result).toBe(6);
    expect(result).toBeLessThanOrEqual(11);
  });

  it('does not treat an over-award as recoverable appeal value', () => {
    const result = getPossiblePointsBack(caseWithAnalysis({
      assignment: {
        total_score_earned: 89,
        total_score_possible: 100,
      },
      questions: [
        { question_id: 'q2', points_earned: 9, points_possible: 10 },
      ],
      case_analysis: {
        overall_case_strength: 'weak',
        unexplained_deductions: [],
        potential_calculation_errors: [
          { question_id: 'q2', expected_score: 8, actual_score_shown: 9 },
        ],
      },
    }));

    expect(result).toBe(0);
  });
});
