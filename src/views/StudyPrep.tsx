import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { ICONS } from '../constants';
import { caseService, type Case } from '../services/caseService';
import { userService } from '../services/userService';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import { isPreviewMode, isPreviewSupervisorView } from '../lib/previewMode';
import { PREVIEW_ANALYSIS } from '../lib/previewFixtures';
import SupervisorHub from './SupervisorHub';
import StudyReviewStudio from './StudyReviewStudio';

type StudyPattern = {
  id: string;
  label: string;
  practice: string;
  occurrences: number;
  examIds: string[];
  points: number;
  examples: string[];
};

const PREVIEW_EXAMS: Case[] = [
  {
    id: 'study-demo-1', title: 'Thermodynamics Midterm', description: 'Preview study evidence', ref: 'DEMO-EXAM-1', status: 'Draft Ready', progress: 100, evidenceLogged: true, facultyReview: false, userId: 'preview-user', createdAt: new Date(), updatedAt: new Date(),
    analysis: { ...PREVIEW_ANALYSIS, assignment: { ...PREVIEW_ANALYSIS.assignment, title: 'Thermodynamics Midterm', assignment_type: 'exam', total_score_display: '82 / 100' } },
  },
  {
    id: 'study-demo-2', title: 'Physics Final Practice', description: 'Preview study evidence', ref: 'DEMO-EXAM-2', status: 'Draft Ready', progress: 100, evidenceLogged: true, facultyReview: false, userId: 'preview-user', createdAt: new Date(Date.now() - 86_400_000), updatedAt: new Date(),
    analysis: { ...PREVIEW_ANALYSIS, assignment: { ...PREVIEW_ANALYSIS.assignment, title: 'Physics Final Practice', assignment_type: 'exam', total_score_display: '76 / 100' }, questions: PREVIEW_ANALYSIS.questions.map((question) => question.question_id === 'Q2' ? { ...question, points_lost: 5, professor_comments: [{ comment_text: 'Check units and show the conversion.', location: 'on_submission' as const, references_specific_part: true }] } : question) },
  },
];

const PATTERN_RULES: Array<{ id: string; label: string; practice: string; match: RegExp }> = [
  { id: 'calculation', label: 'Recheck calculations', practice: 'Redo one problem slowly, then verify each operation with a second method.', match: /calcul|arithmetic|algebra|equation|numeric|number|formula/i },
  { id: 'units', label: 'Check units and labels', practice: 'Add a units-and-notation pass before you hand in each answer.', match: /unit|label|notation|significant figure|dimension/i },
  { id: 'evidence', label: 'Support answers with evidence', practice: 'For each claim, underline the evidence or course concept that supports it.', match: /evidence|source|cite|citation|quote|justify/i },
  { id: 'show-work', label: 'Show each reasoning step', practice: 'Write the bridge between steps—not just the beginning and final answer.', match: /show.*work|working|step|explain.*reason|missing work/i },
  { id: 'concepts', label: 'Revisit core concepts', practice: 'Teach the core idea out loud, then solve a fresh example without notes.', match: /concept|understand|definition|theory|explain|misconcep/i },
  { id: 'writing', label: 'Tighten written explanations', practice: 'Draft one clear claim, one reason, and one supporting detail for practice answers.', match: /writing|grammar|structure|paragraph|clarity|organization/i },
  { id: 'formatting', label: 'Review formatting requirements', practice: 'Use a short pre-submit checklist for required format, citations, and labels.', match: /format|style|mla|apa|presentation/i },
];

function pointsLost(question: NonNullable<Case['analysis']>['questions'][number]): number {
  if (typeof question.points_lost === 'number') return Math.max(0, question.points_lost);
  return question.points_possible != null && question.points_earned != null
    ? Math.max(0, question.points_possible - question.points_earned) : 0;
}

function questionEvidence(question: NonNullable<Case['analysis']>['questions'][number]): string {
  return [question.question_description, ...question.rubric_items_applied.map((item) => item.description), ...question.professor_comments.map((comment) => comment.comment_text)]
    .filter(Boolean).join(' ');
}

function derivePatterns(cases: Case[]): StudyPattern[] {
  const patterns = new Map<string, StudyPattern>();
  for (const exam of cases) {
    for (const question of exam.analysis?.questions ?? []) {
      const lost = pointsLost(question);
      if (!lost) continue;
      const evidence = questionEvidence(question);
      const rule = PATTERN_RULES.find((candidate) => candidate.match.test(evidence)) ?? {
        id: 'review-feedback', label: 'Review marked feedback', practice: 'Re-read the marked question and write one sentence about what changes next time.',
      };
      const pattern = patterns.get(rule.id) ?? { id: rule.id, label: rule.label, practice: rule.practice, occurrences: 0, examIds: [], points: 0, examples: [] };
      pattern.occurrences += 1;
      pattern.points += lost;
      if (exam.id && !pattern.examIds.includes(exam.id)) pattern.examIds.push(exam.id);
      const example = evidence.trim() || `${question.question_id}: ${lost} marked point${lost === 1 ? '' : 's'}`;
      if (!pattern.examples.includes(example) && pattern.examples.length < 2) pattern.examples.push(example.slice(0, 180));
      patterns.set(rule.id, pattern);
    }

    const insights = exam.analysis?.study_insights;
    if (insights?.eligible_exam_evidence && exam.analysis?.assignment.assignment_type === 'exam') {
      for (const focus of insights.focus_areas ?? []) {
        if (!focus.skill?.trim() || !focus.evidence?.trim() || focus.confidence < 0.55) continue;
        const combined = `${focus.skill} ${focus.evidence}`;
        const matched = PATTERN_RULES.find((candidate) => candidate.match.test(combined));
        const id = matched?.id ?? `exam-focus-${focus.skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42)}`;
        const pattern = patterns.get(id) ?? {
          id,
          label: matched?.label ?? focus.skill.trim(),
          practice: focus.practice_next?.trim() || matched?.practice || 'Review the marked example, then solve a similar question without notes.',
          occurrences: 0,
          examIds: [],
          points: 0,
          examples: [],
        };
        if (exam.id && !pattern.examIds.includes(exam.id)) {
          pattern.examIds.push(exam.id);
          pattern.occurrences += 1;
        }
        if (!pattern.examples.includes(focus.evidence) && pattern.examples.length < 2) {
          pattern.examples.push(focus.evidence.slice(0, 180));
        }
        patterns.set(id, pattern);
      }
    }
  }
  return [...patterns.values()].sort((a, b) => b.examIds.length - a.examIds.length || b.points - a.points).slice(0, 6);
}

function examScore(exam: Case): string {
  const assignment = exam.analysis?.assignment;
  if (assignment?.total_score_display) return assignment.total_score_display;
  if (assignment?.total_score_earned != null && assignment.total_score_possible != null) return `${assignment.total_score_earned}/${assignment.total_score_possible}`;
  return 'Marked exam';
}

export default function StudyPrep({
  onStartAppeal,
  onViewPaper,
}: {
  onStartAppeal: () => void;
  onViewPaper?: (caseId: string) => void;
}) {
  const [examCases, setExamCases] = useState<Case[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);
  const [usingPreviewPlan, setUsingPreviewPlan] = useState(false);
  const [accountRole, setAccountRole] = useState<'student' | 'supervisor'>('student');
  const [reviewExam, setReviewExam] = useState<Case | null>(null);
  const [examSearch, setExamSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reviewed' | 'pending'>('all');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const [cases, profile] = await Promise.all([caseService.getUserCases(), userService.getProfile(user.uid)]);
        if (cancelled) return;
        setAccountRole(isPreviewSupervisorView() || profile?.accountRole === 'supervisor' ? 'supervisor' : 'student');
        setExamCases(cases.filter((item) => item.analysis?.assignment.assignment_type === 'exam'));
        setChecked(profile?.studyChecklist ?? []);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const patterns = useMemo(() => derivePatterns(examCases), [examCases]);
  const courses = useMemo(() => [...new Set(examCases.map((exam) => exam.analysis?.assignment.subject?.trim()).filter((value): value is string => Boolean(value)))].sort(), [examCases]);
  const filteredExams = useMemo(() => {
    const query = examSearch.trim().toLowerCase();
    return examCases.filter((exam) => {
      const assignment = exam.analysis?.assignment;
      const matchesQuery = !query || [assignment?.title, assignment?.subject, exam.title, exam.status].some((value) => value?.toLowerCase().includes(query));
      const matchesCourse = courseFilter === 'all' || assignment?.subject === courseFilter;
      const reviewed = exam.progress >= 100 || exam.status === 'Resolved' || Boolean(exam.draftEmail);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'reviewed' ? reviewed : !reviewed);
      return matchesQuery && matchesCourse && matchesStatus;
    });
  }, [courseFilter, examCases, examSearch, statusFilter]);
  const markedPoints = patterns.reduce((sum, pattern) => sum + pattern.points, 0);
  const complete = patterns.filter((pattern) => checked.includes(pattern.id)).length;
  const progress = patterns.length ? Math.round((complete / patterns.length) * 100) : 0;

  const toggle = async (id: string) => {
    const previous = checked;
    const next = previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id];
    setChecked(next);
    const user = auth.currentUser;
    if (!user) return;
    try { await userService.setStudyChecklist(user.uid, next); } catch { setChecked(previous); }
  };

  if (loading) return <div className="flex justify-center py-24"><ICONS.Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  if (accountRole === 'supervisor') return <SupervisorHub />;

  if (reviewExam) return <StudyReviewStudio exam={reviewExam} onBack={() => setReviewExam(null)} />;

  return (
    <div className="space-y-7 pb-8">
      <section className="relative overflow-hidden rounded-[24px] rg-glass-hero px-5 py-8 sm:px-7 sm:py-9">
        <div className="absolute -top-14 -right-10 w-48 h-48 rounded-full bg-violet-400/15 blur-3xl" aria-hidden />
        <div className="relative space-y-3 max-w-2xl">
          <MarketingEyebrow>review · exam evidence only</MarketingEyebrow>
          <h1 className="rg-serif text-[clamp(32px,7vw,44px)] text-ink font-semibold leading-[1.05]">Exam review.</h1>
          <p className="text-[14px] sm:text-[15px] leading-relaxed text-ink-muted">See patterns in your marked exams and decide what to practise next.</p>
        </div>
      </section>

      {!examCases.length ? (
        <section className="rg-glass-form-card p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><ICONS.BookOpen className="w-6 h-6" strokeWidth={1.8} /></div>
          <div><h2 className="rg-serif text-xl text-ink font-semibold">Your Review room starts with one marked exam.</h2><p className="text-[13px] text-ink-muted leading-relaxed mt-2 max-w-sm mx-auto">Upload an exam that shows its score, rubric, or teacher feedback. Once it is analyzed, its visible marks can become your review plan.</p></div>
          <AnimatedPrimaryButton onClick={onStartAppeal} showPlus className="max-w-xs mx-auto">Analyze a marked exam</AnimatedPrimaryButton>
          {isPreviewMode() && <button type="button" onClick={() => { setExamCases(PREVIEW_EXAMS); setUsingPreviewPlan(true); }} className="text-[13px] font-semibold text-primary hover:underline">View a sample review plan</button>}
        </section>
      ) : <>
        <section className="grid grid-cols-3 gap-3">
          <div className="rg-glass-stat p-4"><p className="rg-meta-k">Exams</p><p className="rg-serif text-3xl text-ink font-semibold mt-1">{examCases.length}</p></div>
          <div className="rg-glass-stat p-4"><p className="rg-meta-k">Patterns</p><p className="rg-serif text-3xl text-ink font-semibold mt-1">{patterns.length}</p></div>
          <div className="rg-glass-stat p-4"><p className="rg-meta-k">Marked pts</p><p className="rg-serif text-3xl text-primary font-semibold mt-1">{markedPoints}</p></div>
        </section>

        <section className="rg-glass-form-card p-5 space-y-3">
          <div className="flex items-end justify-between gap-4"><div><MarketingEyebrow>your review progress</MarketingEyebrow><h2 className="rg-serif text-xl text-ink font-semibold mt-1">{complete} of {patterns.length} focus areas reviewed</h2></div><span className="text-lg font-semibold text-primary">{progress}%</span></div>
          <div className="h-2 rounded-full bg-primary/10 overflow-hidden"><motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} /></div>
          <p className="text-[12px] leading-relaxed text-ink-muted">A check means you reviewed the pattern—not that it is permanently solved. Revisit it with your course materials before the final.</p>
        </section>

        <section className="space-y-3">
          <div><MarketingEyebrow>prioritized study plan</MarketingEyebrow><h2 className="rg-serif text-xl text-ink font-semibold mt-1">Start where the pattern appears across the most exams.</h2></div>
          {patterns.map((pattern, index) => {
            const done = checked.includes(pattern.id);
            return <motion.button key={pattern.id} type="button" onClick={() => void toggle(pattern.id)} whileTap={{ scale: 0.985 }} aria-pressed={done} className={`w-full text-left rounded-[18px] border p-4 transition-colors ${done ? 'border-emerald-500/25 bg-emerald-500/[0.07]' : 'border-hairline rg-glass-card'}`}>
              <div className="flex gap-3"><span className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center ${done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-primary/35 text-primary'}`}>{done ? <ICONS.Check className="w-4 h-4" strokeWidth={3} /> : <span className="text-[11px] font-bold">{index + 1}</span>}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className={`text-[15px] font-semibold ${done ? 'text-emerald-900 line-through decoration-emerald-500/50' : 'text-ink'}`}>{pattern.label}</span><span className="text-[11px] font-mono text-primary shrink-0">{pattern.examIds.length} exam{pattern.examIds.length === 1 ? '' : 's'}</span></span>
                  <span className="block text-[12px] text-ink-muted leading-relaxed mt-1.5">Try this: {pattern.practice}</span>
                  {pattern.examples[0] && <span className="block mt-2 text-[11px] text-primary/70 italic truncate">Evidence: {pattern.examples[0]}</span>}
                </span></div>
            </motion.button>;
          })}
          {!patterns.length && <div className="rg-glass-form-card p-5 text-[13px] text-ink-muted">These exams do not contain question-level deductions yet. Upload a marked export with questions or rubric rows for a stronger study plan.</div>}
        </section>

        <section className="space-y-3"><button type="button" onClick={() => setShowEvidence((value) => !value)} className="w-full rg-glass-card rounded-xl p-4 flex items-center justify-between text-left"><span><MarketingEyebrow>exam library</MarketingEyebrow><span className="block rg-serif text-lg text-ink font-semibold mt-1">Browse the exams behind this plan</span></span><span className="flex items-center gap-2 text-[12px] font-semibold text-primary">{examCases.length} exams<ICONS.ChevronDown className={`w-5 h-5 transition-transform ${showEvidence ? 'rotate-180' : ''}`} /></span></button>
          {showEvidence && (
            <div className="space-y-4">
              <div className="grid gap-2 rounded-xl border border-hairline bg-canvas p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <label className="relative block">
                  <span className="sr-only">Search exams</span>
                  <ICONS.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input value={examSearch} onChange={(event) => setExamSearch(event.target.value)} placeholder="Search exam or subject" className="h-10 w-full rounded-lg border border-hairline bg-parchment pl-9 pr-3 text-[13px] text-ink outline-none focus:border-primary" />
                </label>
                <select aria-label="Filter by course" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="h-10 rounded-lg border border-hairline bg-canvas px-3 text-[13px] text-ink outline-none focus:border-primary">
                  <option value="all">All courses</option>
                  {courses.map((course) => <option key={course} value={course}>{course}</option>)}
                </select>
                <select aria-label="Filter by review status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'reviewed' | 'pending')} className="h-10 rounded-lg border border-hairline bg-canvas px-3 text-[13px] text-ink outline-none focus:border-primary">
                  <option value="all">All statuses</option><option value="reviewed">Reviewed</option><option value="pending">Pending</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
              {filteredExams.map((exam) => {
                const hasPages = Boolean(exam.pageImages?.length || exam.pageImageUrls?.length);
                return (
                  <article key={exam.id} className="rounded-xl border border-hairline bg-canvas p-4 flex min-h-[156px] flex-col gap-3 transition-colors hover:border-primary/30">
                    <button
                      type="button"
                      onClick={() => setReviewExam(exam)}
                      className="w-full flex flex-1 items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{exam.analysis?.assignment.subject || 'Course not detected'}</p>
                        <p className="mt-1 font-semibold text-ink line-clamp-2">{exam.analysis?.assignment.title || exam.title}</p>
                        <p className="mt-2 text-[12px] text-ink-muted">{exam.analysis?.questions.length ?? 0} marked question{exam.analysis?.questions.length === 1 ? '' : 's'} · {exam.status}</p>
                      </div>
                      <span className="shrink-0 text-[12px] font-mono text-primary">{examScore(exam)}</span>
                    </button>
                    <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3">
                      <button type="button" onClick={() => setReviewExam(exam)} className="text-[12px] font-semibold text-primary">Open review</button>
                    {onViewPaper && hasPages && exam.id ? (
                      <button
                        type="button"
                        onClick={() => onViewPaper(exam.id!)}
                        className="text-[12px] font-semibold text-ink-muted hover:text-primary inline-flex items-center gap-1"
                      >
                        <ICONS.FileText className="w-3.5 h-3.5" strokeWidth={2} />
                        View paper
                      </button>
                    ) : <span className="text-[11px] text-ink-muted">Text evidence</span>}
                    </div>
                  </article>
                );
              })}
              </div>
              {!filteredExams.length && <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-[13px] text-ink-muted">No exams match those filters.</div>}
            </div>
          )}
        </section>

        {usingPreviewPlan && <p className="rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2 text-[11px] text-primary">Preview sample — no real student work is shown or saved.</p>}
        <p className="text-[12px] text-ink-muted leading-relaxed px-1">This plan is a study aid, not a judgment about you or your ability. Use the original exam, course notes, and your instructor’s guidance as the source of truth.</p>
      </>}
    </div>
  );
}
