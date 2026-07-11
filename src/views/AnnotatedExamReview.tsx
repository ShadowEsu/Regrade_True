import { useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import AppealFlowShell from '../components/AppealFlowShell';
import ChatMarkdown from '../components/ChatMarkdown';
import { caseService, type Case } from '../services/caseService';

type Annotation = {
  questionId: string;
  heading: string;
  teacherComment: string;
  deduction: string;
  aiFinding: string;
  nextStep: string;
};

function buildAnnotations(analysis: NonNullable<Case['analysis']>): Annotation[] {
  const deductions = new Map(
    (analysis.case_analysis.unexplained_deductions ?? []).map((item) => [item.question_id, item]),
  );
  const calculationIssues = new Map(
    (analysis.case_analysis.potential_calculation_errors ?? []).map((item) => [item.question_id, item]),
  );

  return analysis.questions.slice(0, 4).map((question) => {
    const teacherComment = question.professor_comments?.[0]?.comment_text
      ?? analysis.overall_professor_comments
      ?? 'No written comment was extracted for this question.';
    const unexplained = deductions.get(question.question_id);
    const calculation = calculationIssues.get(question.question_id);
    const points = Number(question.points_lost) || Number(unexplained?.points_lost) || 0;
    const aiFinding = calculation?.explanation
      ?? unexplained?.what_is_missing
      ?? (question.deductions_with_no_comment
        ? 'A deduction appears without an explanation tied to a specific line of work.'
        : 'The extracted comment and rubric appear to address the same part of the response.');

    return {
      questionId: question.question_id,
      heading: question.question_description || 'Marked response',
      teacherComment,
      deduction: points > 0 ? `Teacher mark: −${points} point${points === 1 ? '' : 's'}` : 'Teacher feedback recorded',
      aiFinding,
      nextStep: unexplained || calculation
        ? 'Ask for the exact rubric line or worked step that supports this deduction.'
        : 'Use this feedback as a study cue before your next exam.',
    };
  });
}

function PaperAnnotation({ annotation }: { annotation: Annotation }) {
  return (
    <div className="rg-paper-annotation">
      <div className="rg-paper-annotation-line" aria-hidden />
      <div className="space-y-2.5">
        <div>
          <p className="rg-meta-k text-red-600">Teacher feedback</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink">{annotation.teacherComment}</p>
        </div>
        <div>
          <p className="rg-meta-k text-primary">Mr Whale cross-check</p>
          <div className="mt-1 text-[13px] leading-relaxed text-ink"><ChatMarkdown text={annotation.aiFinding} /></div>
        </div>
        <div>
          <p className="rg-meta-k text-emerald-700">Best next step</p>
          <div className="mt-1 text-[13px] leading-relaxed text-ink"><ChatMarkdown text={annotation.nextStep} /></div>
        </div>
      </div>
    </div>
  );
}

export default function AnnotatedExamReview({
  caseId,
  onContinue,
  onBack,
}: {
  caseId: string | null;
  onContinue: () => void;
  onBack?: () => void;
}) {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    void caseService.getCaseById(caseId).then((data) => {
      if (!cancelled && data) {
        setCurrentCase(data);
        setSelectedId(data.analysis?.questions[0]?.question_id ?? null);
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [caseId]);

  const annotations = useMemo(
    () => currentCase?.analysis ? buildAnnotations(currentCase.analysis) : [],
    [currentCase],
  );
  const selected = annotations.find((annotation) => annotation.questionId === selectedId) ?? annotations[0];

  return (
    <AppealFlowShell
      step="annotate"
      title="Review the marked paper."
      subtitle="Teacher feedback stays intact. Mr Whale adds a separate evidence cross-check so you can see what to ask about and what to study."
      onBack={onBack}
      wide
    >
      {!currentCase?.analysis ? (
        <div className="rg-card p-6 text-center text-[14px] text-ink-muted">Loading your marked work…</div>
      ) : selected ? (
        <div className="space-y-4">
          <div className="rg-annotation-notice">
            <ICONS.ShieldCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
            <p>AI annotations are a cross-check, not a replacement for your teacher&apos;s mark or the original paper.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
            <article className="rg-paper-view" aria-label="Paper reconstruction">
              <header className="flex items-start justify-between gap-3 border-b border-ink/10 pb-4">
                <div>
                  <p className="rg-meta-k">Paper view · extracted question</p>
                  <h2 className="mt-1 text-[17px] font-semibold text-ink">{selected.questionId}: {selected.heading}</h2>
                </div>
                <span className="rounded border border-red-500/25 bg-red-500/8 px-2 py-1 text-[11px] font-semibold text-red-700">{selected.deduction}</span>
              </header>

              <div className="py-5">
                <p className="rg-meta-k">Student response region</p>
                <p className="mt-2 max-w-2xl text-[14px] leading-7 text-ink/85">
                  This reconstructed reading view anchors the feedback to the extracted question. When the upload includes a renderable PDF or image, this same review surface can be attached to the original page region.
                </p>
                <div className="mt-5 border-l-2 border-red-500/70 bg-red-500/[0.045] px-4 py-3">
                  <p className="text-[12px] font-semibold text-red-700">Original teacher comment</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink">{selected.teacherComment}</p>
                </div>
                <div className="mt-4 border-l-2 border-primary/70 bg-primary/[0.055] px-4 py-3">
                  <p className="text-[12px] font-semibold text-primary">AI annotation · evidence check</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink">{selected.aiFinding}</p>
                </div>
              </div>
            </article>

            <aside className="rg-annotation-panel">
              <div className="border-b border-hairline px-4 py-3">
                <p className="rg-meta-k">Annotation rail</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">Select a question to compare the original mark with the AI cross-check.</p>
              </div>
              <div className="space-y-1.5 p-2">
                {annotations.map((annotation) => (
                  <button
                    key={annotation.questionId}
                    type="button"
                    onClick={() => setSelectedId(annotation.questionId)}
                    className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${annotation.questionId === selected.questionId ? 'border-primary/30 bg-primary/[0.07]' : 'border-transparent hover:bg-ink/[0.035]'}`}
                  >
                    <p className="text-[12px] font-semibold text-ink">{annotation.questionId}</p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">{annotation.deduction}</p>
                  </button>
                ))}
              </div>
              <div className="border-t border-hairline p-4">
                <PaperAnnotation annotation={selected} />
              </div>
            </aside>
          </div>

          <button type="button" onClick={onContinue} className="rg-btn-primary ml-auto flex py-3 text-[14px]">
            Continue to evidence
            <ICONS.ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="rg-card p-6 text-center text-[14px] text-ink-muted">No question-level marks were extracted from this upload.</div>
      )}
    </AppealFlowShell>
  );
}
