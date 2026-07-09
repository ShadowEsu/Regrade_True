import { describe, expect, it } from 'vitest';
import type { AnalysisResult, SourcePlatform } from '../types';
import type { LmsPlatform } from './index';
import { fromLegacyAnalysis, toAppealStrength, toLmsPlatform } from './adapters';

function makeCaseAnalysis(
  overrides: Partial<AnalysisResult['case_analysis']> = {},
): AnalysisResult['case_analysis'] {
  return {
    rubric_alignment_score: 0.8,
    unexplained_deductions: [],
    potential_calculation_errors: [],
    is_marked_correctly_but_harshly: false,
    correctly_but_harshly_explanation: '',
    strongest_appeal_points: [],
    weakest_appeal_points: [],
    overall_case_strength: 'moderate',
    case_strength_reason: 'Two deductions have no explanation.',
    recommended_appeal_angle: 'unexplained_deduction',
    ...overrides,
  };
}

function makeConfidence(
  overrides: Partial<AnalysisResult['confidence']> = {},
): AnalysisResult['confidence'] {
  return {
    overall_confidence: 0.9,
    low_confidence_items: [],
    requires_retake: false,
    retake_reason: null,
    ...overrides,
  };
}

function makeLegacy(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    source_platform: 'canvas',
    image_types_detected: ['graded_exam'],
    scoring_method: 'negative',
    assignment: {
      title: 'Midterm 2',
      subject: 'Calculus',
      assignment_type: 'exam',
      total_score_earned: 78,
      total_score_possible: 100,
      total_score_display: '78/100',
      percentage: 78,
      letter_grade: 'C+',
    },
    questions: [],
    overall_professor_comments: null,
    teacher_profile: {
      grading_style: 'moderate',
      grading_style_evidence: 'Similar deductions across questions.',
      uses_rubric_consistently: true,
      feedback_quality: 'adequate',
      feedback_quality_explanation: 'Comments on most questions.',
      deduction_pattern: 'rubric_based',
      typical_ceiling_estimate: null,
      marking_philosophy: 'standards_based',
    },
    case_analysis: makeCaseAnalysis(),
    confidence: makeConfidence(),
    ...overrides,
  };
}

describe('toAppealStrength', () => {
  it('maps legacy case strengths onto the spec union', () => {
    expect(toAppealStrength('strong')).toBe('strong');
    expect(toAppealStrength('moderate')).toBe('moderate');
    expect(toAppealStrength('weak')).toBe('weak');
    expect(toAppealStrength('no_case')).toBe('none');
  });
});

describe('platform mapping', () => {
  const cases: [SourcePlatform, LmsPlatform][] = [
    ['canvas', 'canvas'],
    ['gradescope', 'gradescope'],
    ['brightspace', 'd2l'],
    ['teams', 'teams_edu'],
    ['powerschool', 'unknown'],
    ['sakai', 'unknown'],
    ['crowdmark', 'unknown'],
    ['mixed', 'unknown'],
    ['unknown', 'unknown'],
  ];

  it.each(cases)('maps %s to %s', (legacyPlatform, expected) => {
    expect(toLmsPlatform(legacyPlatform)).toBe(expected);
    const analysis = fromLegacyAnalysis(
      makeLegacy({ source_platform: legacyPlatform }),
    );
    expect(analysis.platform).toBe(expected);
  });
});

describe('fromLegacyAnalysis', () => {
  it('converts deductions and calculation errors into typed findings', () => {
    const legacy = makeLegacy({
      case_analysis: makeCaseAnalysis({
        overall_case_strength: 'moderate',
        unexplained_deductions: [
          { question_id: 'q1', points_lost: 5, what_is_missing: 'No comment near the deduction.' },
        ],
        potential_calculation_errors: [
          {
            question_id: 'q2',
            expected_score: 10,
            actual_score_shown: 7,
            discrepancy: 3,
            explanation: 'Column total skips the part credit on 2b.',
          },
        ],
      }),
    });

    const analysis = fromLegacyAnalysis(legacy, '2026-07-09T00:00:00.000Z');

    expect(analysis.findings).toHaveLength(2);
    expect(analysis.findings[0]).toMatchObject({
      questionId: 'q1',
      cause: 'unexplained_deduction',
      strength: 'moderate',
      pointsLost: 5,
      evidence: 'No comment near the deduction.',
      rubricCitation: null,
      teacherQuote: null,
    });
    expect(analysis.findings[1]).toMatchObject({
      questionId: 'q2',
      cause: 'arithmetic_error',
      strength: 'strong',
      pointsLost: 3,
      pointsAwarded: 7,
    });
    expect(analysis.totalPossible).toBe(100);
    expect(analysis.totalAwarded).toBe(78);
    expect(analysis.analyzedAt).toBe('2026-07-09T00:00:00.000Z');
  });

  it('sums recoverablePoints only over moderate or strong findings', () => {
    const weakCase = fromLegacyAnalysis(
      makeLegacy({
        case_analysis: makeCaseAnalysis({
          overall_case_strength: 'weak',
          unexplained_deductions: [
            { question_id: 'q1', points_lost: 5, what_is_missing: 'No explanation given.' },
          ],
          potential_calculation_errors: [
            {
              question_id: 'q2',
              expected_score: 10,
              actual_score_shown: 7,
              discrepancy: 3,
              explanation: 'Total adds to 10, not 7.',
            },
          ],
        }),
      }),
    );

    expect(weakCase.findings[0].strength).toBe('weak');
    expect(weakCase.findings[1].strength).toBe('strong');
    expect(weakCase.recoverablePoints).toBe(3);

    const strongCase = fromLegacyAnalysis(
      makeLegacy({
        case_analysis: makeCaseAnalysis({
          overall_case_strength: 'strong',
          unexplained_deductions: [
            { question_id: 'q1', points_lost: 5, what_is_missing: 'No explanation given.' },
          ],
          potential_calculation_errors: [
            {
              question_id: 'q2',
              expected_score: 10,
              actual_score_shown: 7,
              discrepancy: 3,
              explanation: 'Total adds to 10, not 7.',
            },
          ],
        }),
      }),
    );

    expect(strongCase.recoverablePoints).toBe(8);
  });

  it('recommends an appeal only for moderate or strong cases', () => {
    const strengths: ['strong' | 'moderate' | 'weak' | 'no_case', boolean][] = [
      ['strong', true],
      ['moderate', true],
      ['weak', false],
      ['no_case', false],
    ];

    for (const [legacyStrength, expected] of strengths) {
      const analysis = fromLegacyAnalysis(
        makeLegacy({
          case_analysis: makeCaseAnalysis({
            overall_case_strength: legacyStrength,
          }),
        }),
      );
      expect(analysis.appealRecommended).toBe(expected);
      expect(analysis.caseStrength).toBe(toAppealStrength(legacyStrength));
    }
  });

  it('propagates confidence and reduces it for flagged items', () => {
    const analysis = fromLegacyAnalysis(
      makeLegacy({
        case_analysis: makeCaseAnalysis({
          unexplained_deductions: [
            { question_id: 'q1', points_lost: 4, what_is_missing: 'Handwritten score is smudged.' },
            { question_id: 'q2', points_lost: 2, what_is_missing: 'No comment near the deduction.' },
          ],
        }),
        confidence: makeConfidence({
          overall_confidence: 0.9,
          low_confidence_items: ['q1 handwriting hard to read'],
        }),
      }),
    );

    const flagged = analysis.findings.find((f) => f.questionId === 'q1');
    const clean = analysis.findings.find((f) => f.questionId === 'q2');

    expect(flagged).toBeDefined();
    expect(clean).toBeDefined();
    if (!flagged || !clean) {
      return;
    }
    expect(flagged.confidence).toBeLessThan(0.7);
    expect(flagged.confidence).toBeLessThanOrEqual(0.5);
    expect(clean.confidence).toBeCloseTo(0.9, 5);
  });
});
