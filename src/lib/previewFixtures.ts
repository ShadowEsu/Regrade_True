import type { AnalysisResult } from '../types';
import type { Case } from '../services/caseService';

export const PREVIEW_USER_UID = 'preview-user';

export const PREVIEW_ANALYSIS: AnalysisResult = {
  source_platform: 'gradescope',
  image_types_detected: ['graded_submission_pdf', 'rubric_panel'],
  scoring_method: 'negative',
  assignment: {
    title: 'Problem Set 3 — Thermodynamics',
    subject: 'Physics',
    assignment_type: 'problem_set',
    total_score_earned: 82,
    total_score_possible: 100,
    total_score_display: '82 / 100',
    percentage: 82,
    letter_grade: 'B-',
  },
  questions: [
    {
      question_id: 'Q1',
      question_description: 'Entropy change in an ideal gas expansion',
      points_possible: 25,
      points_earned: 20,
      points_lost: 5,
      scoring_direction: 'deducted_from_full',
      rubric_items_applied: [
        {
          description: 'Correct integral setup',
          point_value: 0,
          was_applied_to_student: true,
          has_explanation: true,
        },
        {
          description: 'Sign error in final ΔS',
          point_value: -5,
          was_applied_to_student: true,
          has_explanation: false,
        },
      ],
      professor_comments: [
        {
          comment_text: 'Setup is fine; check the sign on the last line.',
          location: 'on_submission',
          references_specific_part: true,
        },
      ],
      deductions_with_no_comment: true,
      partial_credit_awarded: true,
    },
    {
      question_id: 'Q2',
      question_description: 'Heat engine efficiency',
      points_possible: 25,
      points_earned: 22,
      points_lost: 3,
      scoring_direction: 'deducted_from_full',
      rubric_items_applied: [],
      professor_comments: [],
      deductions_with_no_comment: false,
      partial_credit_awarded: true,
    },
  ],
  overall_professor_comments: 'Good work overall. Watch unit conversions on Q1.',
  teacher_profile: {
    grading_style: 'moderate',
    grading_style_evidence: 'Most deductions tie to rubric rows; one unexplained −5 on Q1.',
    uses_rubric_consistently: true,
    feedback_quality: 'adequate',
    feedback_quality_explanation: 'Inline bubble on Q1; Q2 has rubric-only marks.',
    deduction_pattern: 'mixed',
    typical_ceiling_estimate: 92,
    marking_philosophy: 'standards_based',
  },
  case_analysis: {
    rubric_alignment_score: 72,
    fairness_review: {
      appears_internally_consistent: false,
      summary_if_marking_sound:
        'The grader applied the rubric consistently on Q2 and left clear margin notes where points were removed.',
      summary_if_marking_questionable:
        'Q1 shows a −5 rubric row with no written justification in the comment bubble, which is hard to defend in an appeal.',
      teacher_may_have_erred_because:
        'The sign-error rubric line may have been intended for a different step than the one marked.',
      student_should_know:
        'Ask for the specific line where the sign error appears; bring your own worked solution.',
    },
    unexplained_deductions: [
      {
        question_id: 'Q1',
        points_lost: 5,
        what_is_missing: 'No comment explains which step triggered the “sign error” rubric item.',
      },
    ],
    potential_calculation_errors: [],
    is_marked_correctly_but_harshly: false,
    correctly_but_harshly_explanation: '',
    strongest_appeal_points: [
      'Request clarification on the Q1 −5: which equation line has the sign error?',
      'Cite the rubric row that requires an explanation when points are deducted.',
    ],
    weakest_appeal_points: ['Arguing the overall B− is unfair without question-level evidence.'],
    overall_case_strength: 'moderate',
    case_strength_reason: 'One clear unexplained deduction with otherwise consistent marking.',
    recommended_appeal_angle: 'unexplained_deduction',
  },
  confidence: {
    overall_confidence: 0.78,
    low_confidence_items: ['Handwritten margin on page 2 — partially legible'],
    requires_retake: false,
    retake_reason: null,
  },
  ai_notes: {
    engines_used: ['gemini', 'claude'],
    extraction_summary:
      'Preview mode: sample Gradescope-style PDF with rubric panel and one inline comment bubble.',
    extraction_uncertainties: ['Page 2 margin note was faint in the sample scan.'],
    reasoning_summary:
      'Preview mode: strongest angle is the unexplained −5 on Q1; calculation on Q2 looks consistent.',
    cross_check_summary: 'Preview mode — no live cross-check; this is demo data only.',
    disagreements: [],
    fallback_used: false,
  },
};

export const PREVIEW_CASE_ID = 'preview-case-demo';

export function buildPreviewSeedCase(): Case {
  const now = new Date();
  return {
    id: PREVIEW_CASE_ID,
    title: 'PS3 Thermodynamics (sample)',
    description: 'Demo appeal from preview mode',
    ref: 'PREVIEW-001',
    status: 'Under Review',
    progress: 65,
    evidenceLogged: true,
    facultyReview: false,
    userId: PREVIEW_USER_UID,
    createdAt: now,
    updatedAt: now,
    analysis: PREVIEW_ANALYSIS,
    rawInput: {
      assignment: 'Problem Set 3 — sample upload',
      rubric: 'Rubric embedded in Gradescope export',
      feedback: 'Gradescope graded PDF with comment bubbles',
    },
  };
}
