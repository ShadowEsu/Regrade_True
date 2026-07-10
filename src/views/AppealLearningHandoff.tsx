import { useEffect, useState } from 'react';
import { ICONS } from '../constants';
import AppealFlowShell from '../components/AppealFlowShell';
import { caseService, type Case } from '../services/caseService';

export default function AppealLearningHandoff({
  caseId,
  onOpenStudy,
  onViewPaper,
  onBack,
}: {
  caseId: string | null;
  onOpenStudy: () => void;
  onViewPaper?: (caseId: string) => void;
  onBack?: () => void;
}) {
  const [currentCase, setCurrentCase] = useState<Case | null>(null);

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    void caseService.getCaseById(caseId).then((data) => {
      if (!cancelled) setCurrentCase(data);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [caseId]);

  const analysis = currentCase?.analysis;
  const learningPoints = [
    analysis?.case_analysis?.student_should_know,
    ...(analysis?.case_analysis?.weakest_appeal_points ?? []).slice(0, 2),
  ].filter((point): point is string => Boolean(point?.trim()));

  return (
    <AppealFlowShell
      step="learn"
      title="Finish with what you learned."
      subtitle="Your draft is ready to copy into your school&apos;s approved channel. Regrade also keeps useful feedback from this marked exam in Review."
      onBack={onBack}
    >
      <div className="space-y-4">
        <div className="rg-card p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-700"><ICONS.Check className="h-4 w-4" strokeWidth={2.25} /></div>
            <div>
              <p className="text-[14px] font-semibold text-ink">Appeal draft finished</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">Regrade does not send messages on your behalf. You remain in control of whether, when, and where you share the draft.</p>
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <p className="rg-section-title">Carry forward</p>
          <div className="space-y-2">
            {(learningPoints.length ? learningPoints : ['Upload more marked exams to build an evidence-based study plan.']).map((point) => (
              <div key={point} className="flex gap-3 border-l-2 border-primary/50 py-1 pl-3">
                <ICONS.BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <p className="text-[13px] leading-relaxed text-ink">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {onViewPaper && caseId && (currentCase?.pageImages?.length || currentCase?.pageImageUrls?.length) && (
          <button
            type="button"
            onClick={() => onViewPaper(caseId)}
            className="rg-btn-secondary w-full py-3 text-[14px] inline-flex items-center justify-center gap-2"
          >
            <ICONS.FileText className="h-4 w-4" strokeWidth={2} />
            See the graded paper with AI notes
          </button>
        )}

        <button type="button" onClick={onOpenStudy} className="rg-btn-primary w-full py-3 text-[14px]">
          Add this exam to Review
          <ICONS.ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </AppealFlowShell>
  );
}
