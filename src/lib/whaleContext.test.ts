import { describe, expect, it } from 'vitest';
import { buildWhaleWorkspaceContext } from './whaleContext';
import type { Case } from '../services/caseService';

const analysis = {
  assignment: { title: 'Fractions Quiz', subject: 'Math', assignment_type: 'exam' as const },
  questions: [],
  case_analysis: { overall_case_strength: 'no_case' as const, case_strength_reason: 'No issue', strongest_appeal_points: [], weaknesses_or_risks: [], recommended_strategy: 'Study' },
  study_insights: { eligible_exam_evidence: true, focus_areas: [], summary: 'Review fractions' },
} as unknown as Case['analysis'];

describe('buildWhaleWorkspaceContext', () => {
  it('pins the selected learner and current assessment without adding unrelated cases', () => {
    const value = buildWhaleWorkspaceContext({ learnerName: 'Emma', currentCaseId: 'exam-1', currentPage: 2, selectedQuestionId: 'Q3', cases: [{ id: 'exam-1', title: 'Quiz', analysis } as Case] });
    expect(value).toContain('CURRENT LEARNER: Emma');
    expect(value).toContain('CURRENT ASSESSMENT');
    expect(value).toContain('"currentPage":2');
    expect(value).toContain('"selectedQuestionId":"Q3"');
    expect(value).not.toContain('Noah');
  });
});
