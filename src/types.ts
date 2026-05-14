
export interface RubricItemApplied {
  description: string;
  point_value: number;
  was_applied_to_student: boolean;
  has_explanation: boolean;
}

export interface ProfessorComment {
  comment_text: string;
  location: 'on_submission' | 'side_panel' | 'separate_page' | 'unknown';
  references_specific_part: boolean;
}

export interface Question {
  question_id: string;
  question_description: string | null;
  points_possible: number | null;
  points_earned: number | null;
  points_lost: number | null;
  scoring_direction: 'deducted_from_full' | 'added_from_zero' | 'unknown';
  rubric_items_applied: RubricItemApplied[];
  professor_comments: ProfessorComment[];
  deductions_with_no_comment: boolean;
  partial_credit_awarded: boolean;
}

export interface TeacherProfile {
  grading_style: 'generous' | 'moderate' | 'harsh' | 'inconsistent';
  grading_style_evidence: string;
  uses_rubric_consistently: boolean;
  feedback_quality: 'detailed' | 'adequate' | 'minimal' | 'absent';
  feedback_quality_explanation: string;
  deduction_pattern: 'rubric_based' | 'comment_based' | 'unexplained' | 'mixed';
  typical_ceiling_estimate: number | null;
  marking_philosophy: 'perfectionist' | 'standards_based' | 'effort_rewarding' | 'outcome_focused' | 'unclear';
}

/** Model’s structured fairness read — not a legal finding. */
export interface FairnessReview {
  appears_internally_consistent: boolean | null;
  summary_if_marking_sound: string;
  summary_if_marking_questionable: string;
  teacher_may_have_erred_because: string | null;
  student_should_know: string;
}

export interface CaseAnalysis {
  rubric_alignment_score: number;
  /** Optional: added when the model returns the extended JSON block. */
  fairness_review?: FairnessReview;
  unexplained_deductions: {
    question_id: string;
    points_lost: number;
    what_is_missing: string;
  }[];
  potential_calculation_errors: {
    question_id: string;
    expected_score: number;
    actual_score_shown: number;
    discrepancy: number;
    explanation: string;
  }[];
  is_marked_correctly_but_harshly: boolean;
  correctly_but_harshly_explanation: string;
  strongest_appeal_points: string[];
  weakest_appeal_points: string[];
  overall_case_strength: 'strong' | 'moderate' | 'weak' | 'no_case';
  case_strength_reason: string;
  recommended_appeal_angle: 'calculation_error' | 'unexplained_deduction' | 'rubric_misapplication' | 'inconsistent_standard' | 'clarification_only' | 'none';
}

export interface AnalysisResult {
  source_platform: 'gradescope' | 'canvas' | 'paper' | 'mixed' | 'unknown';
  image_types_detected: string[];
  scoring_method: 'negative' | 'positive' | 'unknown';
  assignment: {
    title: string | null;
    subject: string | null;
    assignment_type: 'problem_set' | 'exam' | 'lab_report' | 'essay' | 'worksheet' | 'quiz' | 'project' | 'other';
    total_score_earned: number | null;
    total_score_possible: number | null;
    total_score_display: string | null;
    percentage: number | null;
    letter_grade: string | null;
  };
  questions: Question[];
  overall_professor_comments: string | null;
  teacher_profile: TeacherProfile;
  case_analysis: CaseAnalysis;
  confidence: {
    overall_confidence: number;
    low_confidence_items: string[];
    requires_retake: boolean;
    retake_reason: string | null;
  };
}
