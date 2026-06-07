import type { Case } from '../services/caseService';

export function getPossiblePointsBack(c: Case): number {
  const a = c.analysis;
  if (!a) return 0;
  const unexplained =
    a.case_analysis?.unexplained_deductions?.reduce((s, d) => s + (Number(d.points_lost) || 0), 0) ?? 0;
  const calc =
    a.case_analysis?.potential_calculation_errors?.reduce(
      (s, d) => s + (Math.abs(Number(d.discrepancy)) || 0),
      0,
    ) ?? 0;
  return unexplained + calc;
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
  if (c.status === 'Draft Ready') return 'Send to professor';
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
  { id: 'evidence', label: 'Evidence' },
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'Review' },
  { id: 'send', label: 'Send' },
] as const;

export type AppealFlowStepId = (typeof APPEAL_FLOW_STEPS)[number]['id'];
