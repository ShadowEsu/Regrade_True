import type { AnalysisResult } from '../types';
import { chatWithAdvocate } from './gemini';
import { isPreviewMode } from './previewMode';

export function buildCaseContextForAdvocate(analysis: AnalysisResult): string {
  const a = analysis.assignment;
  const ca = analysis.case_analysis;
  const lines: string[] = [];

  if (a.title) lines.push(`Assignment: ${a.title}`);
  if (a.subject) lines.push(`Subject/course: ${a.subject}`);
  if (a.total_score_display) lines.push(`Score shown: ${a.total_score_display}`);
  else if (a.total_score_earned != null && a.total_score_possible != null) {
    lines.push(`Score: ${a.total_score_earned}/${a.total_score_possible}`);
  }
  if (a.percentage != null) lines.push(`Percentage: ${a.percentage}%`);

  lines.push(`Case strength: ${ca.overall_case_strength}`);
  lines.push(`Strength reason: ${ca.case_strength_reason}`);
  lines.push(`Recommended angle: ${ca.recommended_appeal_angle}`);

  if (ca.strongest_appeal_points?.length) {
    lines.push('Strongest appeal points:');
    ca.strongest_appeal_points.forEach((p) => lines.push(`- ${p}`));
  }
  if (ca.unexplained_deductions?.length) {
    lines.push('Unexplained deductions:');
    ca.unexplained_deductions.forEach((d) =>
      lines.push(`- ${d.question_id}: -${d.points_lost} pts — ${d.what_is_missing}`),
    );
  }
  if (ca.potential_calculation_errors?.length) {
    lines.push('Potential calculation errors:');
    ca.potential_calculation_errors.forEach((e) =>
      lines.push(`- ${e.question_id}: expected ${e.expected_score}, got ${e.actual_score_shown} (${e.explanation})`),
    );
  }
  if (analysis.overall_professor_comments) {
    lines.push(`Professor comments: ${analysis.overall_professor_comments.slice(0, 800)}`);
  }

  return lines.join('\n');
}

const DRAFT_INSTRUCTION =
  'Write a professional, polite appeal email to my professor based on the case analysis in your context. ' +
  'Reference specific rubric items and point values where relevant. Keep it concise (under 250 words). ' +
  'Include a subject line on the first line prefixed with "Subject:". Sign off with [Your Name]. ' +
  'Output only the email.';

export async function generateAppealDraft(
  analysis: AnalysisResult,
  options?: { reviseFrom?: string },
): Promise<string> {
  if (isPreviewMode()) {
    await new Promise((r) => setTimeout(r, 600));
    const title = analysis.assignment.title || 'my recent assignment';
    return (
      `Subject: Request for grade review — ${title}\n\n` +
      `Dear Professor,\n\n` +
      `I hope you are doing well. I am writing to respectfully request a review of my grade on ${title}. ` +
      `After reviewing the rubric and feedback, I noticed a few areas where I believe points may have been deducted without explanation or where the scoring may not align with the rubric.\n\n` +
      `${analysis.case_analysis.strongest_appeal_points?.[0] ?? 'I would appreciate clarification on how my work was evaluated against the rubric criteria.'}\n\n` +
      `I would be grateful for any clarification or reconsideration you can offer. Thank you for your time.\n\n` +
      `Best regards,\n[Your Name]`
    );
  }

  const message = options?.reviseFrom
    ? `Revise this appeal email using the case context. Keep a respectful, professional tone.\n\nCurrent draft:\n${options.reviseFrom}`
    : DRAFT_INSTRUCTION;

  const context = buildCaseContextForAdvocate(analysis);
  return chatWithAdvocate(message, [], { caseContext: context });
}
