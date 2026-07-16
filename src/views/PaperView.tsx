import { useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import AppealFlowShell from '../components/AppealFlowShell';
import { caseService, type Case } from '../services/caseService';
import type { AnalysisResult, Question } from '../types';
import DocumentAnnotator from '../components/DocumentAnnotator';
import ContextualWhale from '../components/ContextualWhale';
import { EvidenceRow, PageHeader, PrimaryButton, StatusBadge } from '../components/mobile/MobilePrimitives';

/**
 * PaperView shows the student's own graded copy back to them, page by page,
 * with the AI's findings surfaced next to the teacher's marks. The paper stays
 * the source of truth; the app never claims to know what a teacher meant when
 * no comment was written. If the teacher left nothing, we say so plainly.
 */
export default function PaperView({
  caseId,
  onBack,
  onOpenAppeal,
  mode = 'review',
}: {
  caseId: string | null;
  onBack: () => void;
  onOpenAppeal?: () => void;
  /** review = History path, learn = Study path (emphasises learning). */
  mode?: 'review' | 'learn';
}) {
  const [record, setRecord] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    void caseService.getCaseById(caseId).then((data) => {
      setRecord(data);
      setLoading(false);
    });
  }, [caseId]);

  const pages = usePages(record);
  const annotations = useMemo(() => buildAnnotations(record?.analysis, mode), [record, mode]);
  const teacherWroteNothing =
    (record?.analysis?.questions ?? []).every(
      (q) => (q.professor_comments ?? []).length === 0,
    ) && !record?.analysis?.overall_professor_comments;

  if (loading) {
    return (
      <AppealFlowShell title="Your paper" step="evidence" onBack={onBack}>
        <div className="min-h-[45vh] grid place-items-center gap-3 flex-col">
          <BrandSpinner size={28} />
          <p className="text-sm text-ink-muted">Loading your graded copy</p>
        </div>
      </AppealFlowShell>
    );
  }

  if (!record) {
    return (
      <AppealFlowShell title="Your paper" step="evidence" onBack={onBack}>
        <div className="rg-glass-card p-6 text-center space-y-3">
          <p className="text-[14px] text-ink font-medium">We couldn&apos;t find that appeal.</p>
          <p className="text-[13px] text-ink-muted">It may have been deleted, or the link is out of date.</p>
        </div>
      </AppealFlowShell>
    );
  }

  return (
      <div className="rg3-screen rg3-paper-screen">
        <PageHeader back onBack={onBack} eyebrow={record.analysis?.assignment.subject ?? 'Exam review'} title={record.analysis?.assignment.title ?? record.title} action={<ICONS.MoreHorizontal />} />
        <div className="rg3-paper-summary"><div><span>Final score</span><strong>{record.analysis?.assignment.total_score_display ?? 'Marked exam'}</strong></div><StatusBadge tone={annotations.some((item) => item.appealable) ? 'yellow' : 'green'}>{annotations.some((item) => item.appealable) ? `${annotations.filter((item) => item.appealable).length} to review` : 'Reviewed'}</StatusBadge></div>
        <div className="rg3-paper-actions"><button type="button"><ICONS.BookOpen />Understand</button><button type="button"><ICONS.RefreshCcw />Review again</button><button type="button" onClick={() => document.querySelector('.rg2-context-whale-head') instanceof HTMLElement && (document.querySelector('.rg2-context-whale-head') as HTMLElement).click()}><ICONS.Bot />Ask Mr Whale</button></div>

        <div className="rg3-paper-review-layout">
          <div>
            {pages.length === 0 ? (
              <PaperMissingNotice mode={mode} />
            ) : (
              <div className="rg3-paper-workspace"><DocumentAnnotator caseId={record.id ?? caseId ?? ''} pageIndex={pageIndex} src={pages[pageIndex]} pageLabel={`Graded page ${pageIndex + 1} of ${pages.length}`} />{pages.length > 1 && <div className="rg3-page-nav"><button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex((value) => Math.max(0,value-1))}><ICONS.ChevronLeft /></button><span>Page {pageIndex + 1} of {pages.length}</span><button type="button" disabled={pageIndex === pages.length - 1} onClick={() => setPageIndex((value) => Math.min(pages.length-1,value+1))}><ICONS.ChevronRight /></button></div>}</div>
            )}
          </div>

          <section className="rg3-paper-evidence space-y-3"><div className="rg3-section-title"><div><span>Evidence</span><h2>{mode === 'learn' ? 'What to understand next' : 'What Regrade found'}</h2></div><small>{annotations.length} notes</small></div>

          {teacherWroteNothing && (
            <p className="rg-glass-card p-4 text-[13px] text-ink-muted leading-relaxed">
              Your teacher didn&apos;t leave written comments on this paper. Without their words, we can&apos;t
              tell you exactly what they thought. What we can do is show the marks and the score. If you
              want more, ask them in class or office hours, kindly.
            </p>
          )}

          {annotations.length === 0 && !teacherWroteNothing && (
            <p className="rg-glass-card p-4 text-[13px] text-ink-muted leading-relaxed">
              No questions on this paper triggered a note from Regrade. That usually means the marking
              lines up with the rubric.
            </p>
          )}

          <div className="space-y-2">{annotations.map((a) => <div key={a.id}><EvidenceRow value={a.appealable ? `+${Math.max(1,a.pointsLost)}` : a.pointsLost ? `−${a.pointsLost}` : 'i'} tone={a.appealable ? 'positive' : a.pointsLost ? 'negative' : 'neutral'} title={`${a.questionId} · ${a.heading}`} body={a.aiExplanation} tag={a.teacherQuote ? 'Teacher comment' : a.appealable ? 'Possible issue' : undefined} /></div>)}</div>
          </section>
        </div>

        {record.analysis && <ContextualWhale analysis={record.analysis} />}

        {mode === 'review' && onOpenAppeal && annotations.some((a) => a.appealable) && (
          <PrimaryButton onClick={onOpenAppeal}>Draft appeal <ICONS.ArrowRight /></PrimaryButton>
        )}
      </div>
  );
}

type Annotation = {
  id: string;
  questionId: string;
  heading: string;
  teacherQuote: string | null;
  redUnderline: string | null;
  aiExplanation: string;
  pointsLost: number;
  appealable: boolean;
  studyTip: string;
};

function PaperMissingNotice({ mode }: { mode: 'review' | 'learn' }) {
  return (
    <div className="rg-glass-card p-5 space-y-2">
      <p className="text-[14px] font-semibold text-ink">
        The paper pages are not saved for this appeal.
      </p>
      <p className="text-[13px] text-ink-muted leading-relaxed">
        {mode === 'learn'
          ? 'To learn from the annotations, re-upload the graded copy from the Appeal tab.'
          : 'Older appeals were text-only. Start a new appeal and the pages will be saved with it.'}
      </p>
    </div>
  );
}

function usePages(record: Case | null): string[] {
  return useMemo(() => {
    if (!record) return [];
    if (record.pageImages?.length) {
      return record.pageImages.map(
        (img) => `data:${img.mimeType};base64,${img.data}`,
      );
    }
    if (record.pageImageUrls?.length) return [...record.pageImageUrls];
    return [];
  }, [record]);
}

/**
 * Convert the AI analysis into a list of paper annotations. Each annotation
 * pairs a question with a teacher quote (if any), the specific words we would
 * red-underline on paper, and an explanation in plain English. When the teacher
 * left no comment for a question, we say so explicitly.
 */
function buildAnnotations(
  analysis: AnalysisResult | undefined,
  mode: 'review' | 'learn',
): Annotation[] {
  if (!analysis) return [];

  const unexplained = new Map(
    (analysis.case_analysis.unexplained_deductions ?? []).map((d) => [d.question_id, d]),
  );
  const calculationErrors = new Map(
    (analysis.case_analysis.potential_calculation_errors ?? []).map((c) => [c.question_id, c]),
  );

  return analysis.questions
    .map((q): Annotation | null => {
      const pointsLost = Math.max(0, Number(q.points_lost) || 0);
      const teacherComment = q.professor_comments?.[0]?.comment_text ?? null;
      const calc = calculationErrors.get(q.question_id);
      const unfair = unexplained.get(q.question_id);
      const noComment = !teacherComment && q.deductions_with_no_comment;
      const truncatedDescription = truncateSentence(q.question_description, 90);

      if (pointsLost === 0 && !teacherComment && !calc && !unfair) return null;

      let aiExplanation: string;
      let redUnderline: string | null = null;
      let appealable = false;

      if (calc) {
        aiExplanation = `The rubric total on this problem doesn’t add up. Expected ${calc.expected_score}, saw ${calc.actual_score_shown}. ${calc.explanation}`;
        redUnderline = `${calc.expected_score} vs ${calc.actual_score_shown}`;
        appealable = true;
      } else if (unfair) {
        aiExplanation = `Points were removed here without a clear reason. ${unfair.what_is_missing}`;
        redUnderline = truncatedDescription;
        appealable = true;
      } else if (noComment) {
        aiExplanation = 'Points came off, but no written comment explains why. That is worth asking about, at minimum.';
        redUnderline = truncatedDescription;
        appealable = true;
      } else if (teacherComment) {
        aiExplanation =
          mode === 'learn'
            ? `Your teacher marked this as ${describeTeacherLocation(q)}. Use it as a study cue: check the underlined step against the rubric.`
            : 'The teacher’s comment lines up with the rubric here. Nothing to appeal, but the reasoning is useful for the next assignment.';
        redUnderline = truncateQuote(teacherComment, 100);
      } else {
        aiExplanation = 'No detail was captured for this question.';
      }

      return {
        id: q.question_id,
        questionId: q.question_id,
        heading: truncatedDescription ?? 'This question',
        teacherQuote: teacherComment,
        redUnderline,
        aiExplanation,
        pointsLost,
        appealable,
        studyTip: buildStudyTip(q, analysis),
      };
    })
    .filter((x): x is Annotation => x !== null);
}

function truncateSentence(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + '…';
}

function truncateQuote(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + '…';
}

function describeTeacherLocation(q: Question): string {
  const loc = q.professor_comments?.[0]?.location;
  switch (loc) {
    case 'on_submission':
      return 'a note directly on your submission';
    case 'side_panel':
      return 'feedback in the side panel';
    case 'rubric_panel':
      return 'a rubric line item';
    case 'margin_handwritten':
      return 'a handwritten margin note';
    case 'separate_page':
      return 'feedback on a separate page';
    default:
      return 'a comment on this question';
  }
}

function buildStudyTip(q: Question, analysis: AnalysisResult): string {
  const style = analysis.teacher_profile?.marking_philosophy;
  if (q.deductions_with_no_comment) {
    return 'Practise showing your working step by step. Silent deductions often mean the grader wanted to see the reasoning, not just the answer.';
  }
  if (style === 'perfectionist') {
    return 'This teacher marks strictly. On the next assignment, double-check units, signs, and definitions before submitting.';
  }
  if (style === 'standards_based') {
    return 'Line each answer up with the exact rubric wording before you submit. That is how this teacher scores.';
  }
  return 'Try re-solving this problem from scratch tonight without looking at your paper. If you get stuck at the same step, that is the gap to close.';
}
