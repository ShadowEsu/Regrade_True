/**
 * Regrade spec contracts. These are the shared types every feature agent
 * builds against. The legacy AI pipeline types live in `src/types.ts`
 * (snake_case); `./adapters.ts` bridges legacy output into these shapes.
 */

/** Why a point deduction happened, from the student's point of view. */
export type DeductionCause =
  | 'marked_correctly'
  | 'genuine_error'
  | 'rubric_mismatch'
  | 'unexplained_deduction'
  | 'arithmetic_error'
  | 'handwriting_misread'
  | 'work_shown_not_credited'
  | 'partial_credit_withheld'
  | 'inconsistent_grading'
  | 'feedback_contradicts_rubric'
  | 'late_penalty_error'
  | 'accommodation_not_applied'
  | 'ai_detection_false_positive'
  | 'needs_human_judgment';

/** How defensible an appeal on a finding (or the whole case) would be. */
export type AppealStrength = 'none' | 'weak' | 'moderate' | 'strong';

/** LMS platforms the spec recognizes. Legacy names map in via adapters. */
export type LmsPlatform =
  | 'canvas'
  | 'gradescope'
  | 'moodle'
  | 'blackboard'
  | 'turnitin'
  | 'google_classroom'
  | 'd2l'
  | 'schoology'
  | 'teams_edu'
  | 'paper'
  | 'unknown';

/** One reviewed deduction on one question. */
export interface RubricFinding {
  questionId: string;
  pointsPossible: number;
  pointsAwarded: number;
  pointsLost: number;
  cause: DeductionCause;
  strength: AppealStrength;
  /** Plain-language explanation of what was observed on the graded work. */
  evidence: string;
  /** Verbatim rubric line supporting the finding, or null when none exists. */
  rubricCitation: string | null;
  /** Verbatim teacher comment supporting the finding, or null when none exists. */
  teacherQuote: string | null;
  /**
   * 0 to 1. Findings below 0.7 must be surfaced with a low-confidence
   * warning in the UI and must never be presented as certain.
   */
  confidence: number;
}

/** Something the student still needs to gather before appealing. */
export interface MissingArtifact {
  kind:
    | 'rubric'
    | 'teacher_comments'
    | 'assignment_prompt'
    | 'original_work'
    | 'syllabus'
    | 'grade_post_date'
    | 'prior_emails';
  /** Names the exact LMS screen or step where the student can find it. */
  howToGet: string;
}

/** Full analysis of one graded assignment in spec terms. */
export interface AppealAnalysis {
  platform: LmsPlatform;
  totalPossible: number;
  totalAwarded: number;
  findings: RubricFinding[];
  missing: MissingArtifact[];
  caseStrength: AppealStrength;
  /**
   * Sum of pointsLost across findings whose strength is at least
   * 'moderate'. Weak and none findings never count toward this number.
   */
  recoverablePoints: number;
  /** True only when caseStrength is 'moderate' or 'strong'. */
  appealRecommended: boolean;
  /** ISO 8601 timestamp of when the analysis completed. */
  analyzedAt: string;
}

/** Result of the integrity gate that decides whether a draft may be sent. */
export interface SendGateResult {
  allowed: boolean;
  /** Copy key (or resolved string) explaining a block; null when allowed. */
  reason: string | null;
  remainingAppealsThisTerm: number;
}

/** Lifecycle record of one appeal, one per assignment. */
export interface AppealRecord {
  id: string;
  courseId: string;
  assignmentId: string;
  findingIds: string[];
  status:
    | 'drafted'
    | 'sent'
    | 'awaiting_response'
    | 'granted'
    | 'partial'
    | 'denied'
    | 'abandoned';
  sentAt: string | null;
  respondedAt: string | null;
  pointsRecovered: number | null;
  /** ISO 8601 date the grade was posted; deadline math starts here. */
  gradePostedAt: string;
  appealDeadline: string | null;
}

/** Derived writing-style profile. Never stores source emails. */
export interface ProfessorToneProfile {
  /** SHA-256 hash of the professor identity, never plaintext. */
  professorId: string;
  formality: 'first_name' | 'title_last_name' | 'unknown';
  averageReplyLength: number | null;
  signOff: string | null;
  /** Count of source emails the profile was derived from. */
  observedFrom: number;
}

/** Parent-to-student account link. K-12 only, enforced at both levels. */
export interface HouseholdLink {
  parentAccountId: string;
  studentAccountId: string | null;
  educationLevel: 'k12';
  verifiedAt: string;
}

/** Three conference questions a parent can ask, tied to real findings. */
export interface PrepSheet {
  questions: [string, string, string];
  basedOnFindingIds: string[];
}

/** Termly per-assignment view of points lost and explanation coverage. */
export interface TransparencyReport {
  term: string;
  rows: {
    courseId: string;
    assignmentId: string;
    pointsLost: number;
    hadExplanation: boolean;
  }[];
}

/** Appeal-window deadline info for one appeal record. */
export interface Deadline {
  deadlineAt: string | null;
  daysRemaining: number | null;
  /** 'unknown_school_default' means the 14-day fallback policy was used. */
  policySource: 'seeded' | 'unknown_school_default';
  /** 'half' fires at 50% of the window elapsed, 'eighty' at 80%. */
  warnLevel: 'none' | 'half' | 'eighty';
}

/** Grade and GPA movement if the appeal recovers its points. */
export interface GpaDelta {
  courseGradeBefore: number;
  courseGradeAfter: number;
  gpaBefore: number;
  gpaAfter: number;
}

/** Term identifier, e.g. "2026-fall". */
export type TermId = string;

/** Current course load used for GPA impact math. */
export type CourseLoad = {
  courseId: string;
  credits: number;
  currentPercent: number;
}[];
