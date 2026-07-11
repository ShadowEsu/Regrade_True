/**
 * Unit tests for deterministic grading audit (no API key required).
 * Run: npx tsx server/scripts/test-grade-audit.ts
 */
import {
  auditGradingCompleteness,
  mergeAuditIntoAnalysis,
} from '../src/shared/gradeExtractionAudit.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}

console.log('\n=== Score-only export (no comments, no rubric) ===');
{
  const audit = auditGradingCompleteness({
    scoring_method: 'negative',
    questions: [
      {
        question_id: 'Q1',
        points_possible: 10,
        points_earned: 7,
        rubric_items_applied: [],
        professor_comments: [],
      },
      {
        question_id: 'Q2',
        points_possible: 5,
        points_earned: 3,
        rubric_items_applied: [],
        professor_comments: [],
      },
    ],
  });
  assert(audit.score_only_export === true, 'detects score-only export');
  assert(audit.unexplained_deductions.length === 2, 'flags both questions');
  assert(
    audit.questions[0]?.deductions_with_no_comment === true,
    'sets deductions_with_no_comment on Q1',
  );
}

console.log('\n=== Gradescope rubric label only (no written reason) ===');
{
  const audit = auditGradingCompleteness({
    scoring_method: 'negative',
    questions: [
      {
        question_id: 'Q3',
        points_possible: 8,
        points_earned: 5,
        rubric_items_applied: [
          {
            description: 'Missing units',
            point_value: -2,
            was_applied_to_student: true,
            has_explanation: false,
          },
          {
            description: 'Wrong sign',
            point_value: -1,
            was_applied_to_student: true,
            has_explanation: false,
          },
        ],
        professor_comments: [],
      },
    ],
  });
  assert(audit.unexplained_deductions.length === 1, 'flags weak rubric-only feedback');
  assert(
    audit.potential_calculation_errors.length === 0,
    'no calc error when earned matches rubric sum (8 + (-2) + (-1) = 5)',
  );
}

console.log('\n=== Arithmetic mismatch from applied rubric ===');
{
  const audit = auditGradingCompleteness({
    scoring_method: 'negative',
    questions: [
      {
        question_id: 'Q4',
        points_possible: 10,
        points_earned: 6,
        rubric_items_applied: [
          { description: 'Error A', point_value: -2, was_applied_to_student: true },
          { description: 'Error B', point_value: -1, was_applied_to_student: true },
        ],
        professor_comments: [{ comment_text: 'See rubric' }],
      },
    ],
  });
  assert(audit.potential_calculation_errors.length === 1, 'detects rubric sum vs displayed score');
  assert(
    audit.potential_calculation_errors[0]?.expected_score === 7,
    'expected 10 - 2 - 1 = 7',
  );
}

console.log('\n=== Partial positive-scoring rubric is not a complete equation ===');
{
  const audit = auditGradingCompleteness({
    scoring_method: 'positive',
    questions: [{
      question_id: 'Q5', points_possible: 5, points_earned: 4.25,
      scoring_direction: 'added_from_zero',
      rubric_items_applied: [{ description: 'Main method', point_value: 3.5, was_applied_to_student: true }],
      professor_comments: [{ comment_text: 'Additional partial credit explained in comment.' }],
    }],
  });
  assert(audit.potential_calculation_errors.length === 0, 'does not invent an arithmetic error from partial positive rows');
}

console.log('\n=== Student pasted rubric ===');
{
  const rubricData = `Q1: Full credit requires correct derivative and simplified form.
Q2: Must cite two sources with APA format.`;
  const audit = auditGradingCompleteness(
    {
      scoring_method: 'unknown',
      questions: [
        {
          question_id: 'Q1',
          points_possible: 5,
          points_earned: 2,
          rubric_items_applied: [],
          professor_comments: [],
        },
      ],
    },
    { rubricData },
  );
  assert(audit.student_supplied_rubric === true, 'detects pasted rubric');
  assert(audit.missing_rubric_on_upload === false, 'does not ask for rubric when student pasted it');
}

console.log('\n=== Merge into analysis case_analysis ===');
{
  const merged = mergeAuditIntoAnalysis(
    {
      questions: [],
      case_analysis: { unexplained_deductions: [], potential_calculation_errors: [] },
    },
    {
      questions: [],
      extraction_uncertainties: ['test uncertainty'],
      unexplained_deductions: [
        { question_id: 'Q1', points_lost: 2, what_is_missing: 'no comment' },
      ],
      potential_calculation_errors: [],
      score_only_export: true,
      missing_rubric_on_upload: true,
      student_supplied_rubric: false,
    },
  );
  assert(
    (merged.case_analysis as { unexplained_deductions: unknown[] }).unexplained_deductions.length === 1,
    'merges unexplained deductions',
  );
  assert(
    (merged.case_analysis as { recommended_appeal_angle?: string }).recommended_appeal_angle ===
      'unexplained_deduction',
    'prefers unexplained_deduction when score-only export has missing feedback',
  );

  const mergedClarify = mergeAuditIntoAnalysis(
    {
      questions: [],
      case_analysis: { unexplained_deductions: [], potential_calculation_errors: [] },
    },
    {
      questions: [],
      extraction_uncertainties: [],
      unexplained_deductions: [],
      potential_calculation_errors: [],
      score_only_export: true,
      missing_rubric_on_upload: false,
      student_supplied_rubric: false,
    },
  );
  assert(
    (mergedClarify.case_analysis as { recommended_appeal_angle?: string }).recommended_appeal_angle ===
      'clarification_only',
    'uses clarification_only when score-only with no specific gaps flagged',
  );
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
