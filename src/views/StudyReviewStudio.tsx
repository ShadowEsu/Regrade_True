import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import CoachWhale from '../components/CoachWhale';
import MarketingEyebrow from '../components/MarketingEyebrow';
import ChatMarkdown from '../components/ChatMarkdown';
import { chatWithAdvocate } from '../lib/gemini';
import type { Case } from '../services/caseService';

type AnnotationTone = 'strength' | 'practice' | 'clarify';
type ReviewAnnotation = { id: string; questionId: string; tone: AnnotationTone; title: string; detail: string; evidence: string };

const toneStyle: Record<AnnotationTone, { rail: string; chip: string; label: string }> = {
  strength: { rail: 'border-emerald-400 bg-emerald-50/70', chip: 'bg-emerald-100 text-emerald-800', label: 'Strength' },
  practice: { rail: 'border-sky-400 bg-sky-50/70', chip: 'bg-sky-100 text-sky-800', label: 'Practice' },
  clarify: { rail: 'border-amber-400 bg-amber-50/70', chip: 'bg-amber-100 text-amber-800', label: 'Clarify' },
};

function pointsLost(question: NonNullable<Case['analysis']>['questions'][number]): number {
  if (typeof question.points_lost === 'number') return Math.max(0, question.points_lost);
  return question.points_possible != null && question.points_earned != null ? Math.max(0, question.points_possible - question.points_earned) : 0;
}

function annotationFor(question: NonNullable<Case['analysis']>['questions'][number]): ReviewAnnotation {
  const lost = pointsLost(question);
  const comment = question.professor_comments[0]?.comment_text;
  const rubric = question.rubric_items_applied.find((item) => item.was_applied_to_student)?.description;
  if (lost === 0) return { id: `${question.question_id}-strength`, questionId: question.question_id, tone: 'strength', title: 'Marked as a strength', detail: 'No points were shown as lost on this question.', evidence: comment || rubric || 'Visible score shows no deduction.' };
  if (question.deductions_with_no_comment) return { id: `${question.question_id}-clarify`, questionId: question.question_id, tone: 'clarify', title: `Clarify the −${lost} points`, detail: 'The analysis found a deduction without a linked written explanation.', evidence: rubric || 'No question-specific comment was extracted.' };
  return { id: `${question.question_id}-practice`, questionId: question.question_id, tone: 'practice', title: `Practice this ${lost}-point gap`, detail: 'Use the rubric and teacher feedback to revise this exact step before your next exam.', evidence: comment || rubric || 'Points were deducted on this question.' };
}

export default function StudyReviewStudio({ exam, onBack }: { exam: Case; onBack: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const analysis = exam.analysis;
  const annotations = useMemo(() => (analysis?.questions ?? []).map(annotationFor), [analysis]);
  const active = annotations.find((item) => item.id === activeId) ?? annotations[0] ?? null;

  const askWhale = async () => {
    const message = input.trim();
    if (!message || asking || !analysis) return;
    setAsking(true);
    setAnswer(null);
    try {
      const context = JSON.stringify({ assignment: analysis.assignment, selected_annotation: active, questions: analysis.questions }, null, 2);
      setAnswer(await chatWithAdvocate(message, [], { caseContext: context }));
      setInput('');
    } catch {
      setAnswer('Mr Whale could not reach the review service. Try again in a moment.');
    } finally { setAsking(false); }
  };

  return <div className="space-y-5 pb-8">
    <div className="flex items-center justify-between gap-3"><button type="button" onClick={onBack} className="rg-btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-[13px]"><ICONS.ChevronLeft className="h-4 w-4" />Review plan</button><span className="rg-meta-k">review studio</span></div>
    <section className="rounded-[24px] rg-glass-hero p-5 sm:p-7"><MarketingEyebrow>marked-exam learning review</MarketingEyebrow><h1 className="rg-serif mt-2 text-[clamp(27px,6vw,38px)] font-semibold leading-tight text-ink">Understand the mark. Then practise the exact skill.</h1><p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-muted">Each annotation is generated from extracted scores, rubric rows, and teacher feedback. Blue means practise, green means a visible strength, and amber means ask for clarification—not an assumed grading error.</p></section>
    {!analysis ? <section className="rg-glass-form-card p-6 text-center text-[14px] text-ink-muted">This exam does not have an analysis yet.</section> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
      <section className="rg-glass-form-card overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4"><div><MarketingEyebrow>evidence map</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl font-semibold text-ink">{analysis.assignment.title || exam.title}</h2></div><span className="rounded-full bg-primary/8 px-3 py-1.5 text-[11px] font-semibold text-primary">{analysis.assignment.total_score_display || 'Marked work'}</span></div><div className="space-y-3 p-4 sm:p-5">{annotations.map((item) => { const style = toneStyle[item.tone]; const isActive = active?.id === item.id; const question = analysis.questions.find((value) => value.question_id === item.questionId); return <motion.button key={item.id} type="button" onClick={() => setActiveId(item.id)} whileTap={{ scale: 0.992 }} className={`w-full border-l-4 rounded-r-2xl p-4 text-left transition-shadow ${style.rail} ${isActive ? 'shadow-md ring-1 ring-ink/10' : 'hover:shadow-sm'}`}><div className="flex items-start justify-between gap-3"><div><p className="rg-meta-k">{item.questionId} {question?.points_earned != null && question.points_possible != null ? `· ${question.points_earned}/${question.points_possible}` : ''}</p><p className="mt-1 text-[15px] font-semibold text-ink">{item.title}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.chip}`}>{style.label}</span></div><p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{item.evidence}</p></motion.button>; })}{!annotations.length && <p className="p-4 text-[13px] text-ink-muted">This exam has no question-level marks to map yet. Upload a marked copy with its score, rubric, or feedback.</p>}</div><p className="border-t border-hairline px-5 py-3 text-[11px] leading-relaxed text-ink-muted">Document-image overlays are enabled only after Regrade securely retains the original marked pages and the reviewer returns page coordinates. This evidence map never invents an outline on a document it cannot display.</p></section>
      <aside className="rg-glass-form-card flex min-h-[460px] flex-col overflow-hidden"><div className="flex items-center gap-3 border-b border-hairline p-4"><CoachWhale size={44} /><div><p className="rg-meta-k">study coach</p><h2 className="rg-serif text-lg font-semibold text-ink">Ask Mr Whale</h2></div></div><div className="flex-1 space-y-4 p-4"><div className="rounded-xl bg-primary/[0.05] p-3 text-[13px] leading-relaxed text-ink-muted"><span className="font-semibold text-ink">{active?.questionId || 'This exam'}:</span> {active?.detail || 'Select a marked question to focus the conversation.'}<p className="mt-2 text-[11px] italic">Evidence: {active?.evidence || 'No question evidence extracted.'}</p></div>{answer && <div className="border-l-2 border-primary/40 py-1 pl-3"><ChatMarkdown text={answer} /></div>}{asking && <div className="flex items-center gap-2 text-[13px] text-ink-muted"><ICONS.Loader2 className="h-4 w-4 animate-spin text-primary" />Mr Whale is checking the evidence…</div>}</div><form onSubmit={(event) => { event.preventDefault(); void askWhale(); }} className="border-t border-hairline p-3"><label className="sr-only" htmlFor="study-question">Ask Mr Whale about this mark</label><textarea id="study-question" value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder="Ask for a worked equation, chemistry explanation, or practice question…" className="w-full resize-none rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13px] text-ink outline-none focus:border-primary" /><button type="submit" disabled={!input.trim() || asking} className="rg-btn-cta mt-2 w-full py-2.5 text-[13px] disabled:opacity-45">Ask Mr Whale</button></form></aside>
    </div>}
  </div>;
}
