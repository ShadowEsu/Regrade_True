import type { Case } from '../services/caseService';

export function getPossiblePointsBack(c: Case): number {
  const a = c.analysis;
  if (!a) return 0;
  const byQuestion = new Map<string, number>();
  const questionLoss = new Map(
    (a.questions ?? []).map((question) => [
      question.question_id,
      question.points_possible != null && question.points_earned != null
        ? Math.max(0, question.points_possible - question.points_earned)
        : Math.max(0, Number(question.points_lost) || 0),
    ]),
  );
  const record = (questionId: string, raw: number) => {
    const evidenceBound = questionLoss.get(questionId);
    const safe = Math.max(0, Number.isFinite(raw) ? raw : 0);
    const bounded = evidenceBound == null ? safe : Math.min(safe, evidenceBound);
    // A calculation flag and an unexplained-deduction flag can describe the
    // same lost point. Count the strongest claim once, never both.
    byQuestion.set(questionId, Math.max(byQuestion.get(questionId) ?? 0, bounded));
  };
  const caseStrength = a.case_analysis?.overall_case_strength;
  const supportsAppealEstimate = caseStrength === 'moderate' || caseStrength === 'strong';
  if (supportsAppealEstimate) {
    for (const deduction of a.case_analysis?.unexplained_deductions ?? []) {
      record(deduction.question_id, Number(deduction.points_lost));
    }
  }
  for (const error of a.case_analysis?.potential_calculation_errors ?? []) {
    // Only an under-award can be recovered. An over-award is not appeal value.
    record(error.question_id, Number(error.expected_score) - Number(error.actual_score_shown));
  }
  const evidenceTotal = [...byQuestion.values()].reduce((sum, value) => sum + value, 0);
  const overallGap = a.assignment.total_score_possible != null && a.assignment.total_score_earned != null
    ? Math.max(0, a.assignment.total_score_possible - a.assignment.total_score_earned)
    : Number.POSITIVE_INFINITY;
  return Math.round(Math.min(evidenceTotal, overallGap) * 100) / 100;
}

export function getClassName(c: Case): string {
  return c.analysis?.assignment?.subject || c.description || 'Course';
}

export function getScoreDisplay(c: Case): string {
  const a = c.analysis?.assignment;
  if (!a) return '—';
  if (a.total_score_display) return a.total_score_display;
  if (a.total_score_earned != null && a.total_score_possible != null) {
    return `${a.total_score_earned}/${a.total_score_possible}`;
  }
  return '—';
}

export function getNextStep(c: Case): string {
  if (!c.analysis) return 'Upload graded work';
  if (c.progress < 40) return 'Review AI analysis';
  if (c.progress < 70) return 'Review draft email';
  if (c.status === 'Draft Ready') return 'Finish draft and review study notes';
  if (c.status === 'Resolved') return 'View outcome';
  return 'Continue appeal';
}

export function formatCaseDate(raw: Case['createdAt']): string {
  const d =
    typeof raw?.toDate === 'function' ? raw.toDate() : raw instanceof Date ? raw : null;
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const PLATFORMS = [
  { id: 'canvas', label: 'Canvas', color: '#E13F2A' },
  { id: 'gradescope', label: 'Gradescope', color: '#0095D9' },
  { id: 'moodle', label: 'Moodle', color: '#F98012' },
  { id: 'turnitin', label: 'Turnitin', color: '#0055A4' },
  { id: 'classroom', label: 'Classroom', color: '#34A853' },
] as const;

export const APPEAL_FLOW_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'annotate', label: 'Annotate' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'draft', label: 'Draft' },
  { id: 'learn', label: 'Learn' },
] as const;

export type AppealFlowStepId = (typeof APPEAL_FLOW_STEPS)[number]['id'];
