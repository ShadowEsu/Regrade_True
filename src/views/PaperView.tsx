import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import AppealFlowShell from '../components/AppealFlowShell';
import ChatMarkdown from '../components/ChatMarkdown';
import { caseService, type Case } from '../services/caseService';
import type { AnalysisResult, Question } from '../types';

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
    <AppealFlowShell
      title="Your paper"
      step={mode === 'learn' ? 'learn' : 'evidence'}
      onBack={onBack}
    >
      <div className="space-y-5">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            {record.analysis?.assignment.subject ?? 'Assignment'}
          </p>
          <h2 className="rg-serif text-[22px] leading-tight text-ink font-semibold">
            {record.analysis?.assignment.title ?? record.title}
          </h2>
          {record.analysis?.assignment.total_score_display && (
            <p className="text-[13px] text-ink-muted">
              Score:{' '}
              <span className="font-medium text-ink">{record.analysis.assignment.total_score_display}</span>
            </p>
          )}
        </header>

        {pages.length === 0 ? (
          <PaperMissingNotice mode={mode} />
        ) : (
          <div className="space-y-6">
            {pages.map((src, i) => (
              <PaperPage key={src + i} src={src} page={i + 1} totalPages={pages.length} />
            ))}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[15px] font-semibold text-ink">
              {mode === 'learn' ? 'What went wrong, in plain words' : 'What Regrade found'}
            </h3>
            <span className="text-[11px] text-ink-muted">
              {annotations.length} {annotations.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

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

          <ul className="space-y-3">
            {annotations.map((a) => (
              <AnnotationRow key={a.id} annotation={a} mode={mode} />
            ))}
          </ul>
        </section>

        {mode === 'review' && onOpenAppeal && annotations.some((a) => a.appealable) && (
          <div className="rg-glass-card p-4 flex items-center justify-between gap-4">
            <p className="text-[13px] text-ink leading-relaxed">
              At least one of these is worth appealing.
            </p>
            <button
              type="button"
              onClick={onOpenAppeal}
              className="rg-btn-primary text-[13px] px-4 py-2 shrink-0"
            >
              Open the appeal
            </button>
          </div>
        )}
      </div>
    </AppealFlowShell>
  );
}

const PaperPage: React.FC<{ src: string; page: number; totalPages: number }> = ({ src, page, totalPages }) => {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rg-glass-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-ink-muted">
        <span>Page {page} of {totalPages}</span>
        <span className="text-[10px]">Graded copy</span>
      </div>
      <img
        src={src}
        alt={`Graded page ${page}`}
        className="w-full h-auto bg-canvas"
        loading={page === 1 ? 'eager' : 'lazy'}
      />
    </motion.figure>
  );
};

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

const AnnotationRow: React.FC<{ annotation: Annotation; mode: 'review' | 'learn' }> = ({ annotation, mode }) => {
  return (
    <li className="rg-glass-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink">{annotation.questionId}</p>
        {annotation.pointsLost > 0 && (
          <span className="text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
            −{annotation.pointsLost} pt{annotation.pointsLost === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <p className="text-[13px] text-ink leading-relaxed">{annotation.heading}</p>
      {annotation.redUnderline && (
        <p className="text-[13px] leading-relaxed">
          <span className="rg-red-underline">{annotation.redUnderline}</span>
        </p>
      )}
      {annotation.teacherQuote && (
        <p className="text-[12px] text-ink-muted leading-relaxed border-l-2 border-hairline pl-3">
          <ICONS.MessageSquare className="inline w-3 h-3 mr-1 text-ink-muted" strokeWidth={2} />
          {annotation.teacherQuote}
        </p>
      )}
      <div className="text-[13px] text-ink leading-relaxed"><ChatMarkdown text={annotation.aiExplanation} /></div>
      {mode === 'learn' && annotation.studyTip && (
        <div className="text-[12px] leading-relaxed text-emerald-800 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2">
          <ICONS.Lightbulb className="inline w-3.5 h-3.5 mr-1" strokeWidth={2} />
          <ChatMarkdown text={annotation.studyTip} />
        </div>
      )}
    </li>
  );
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
