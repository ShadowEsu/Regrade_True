import { useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import MarketingEyebrow from '../components/MarketingEyebrow';
import { familyService, type FamilyLink } from '../services/familyService';
import type { Case } from '../services/caseService';
import { isPreviewMode } from '../lib/previewMode';
import { PREVIEW_ANALYSIS } from '../lib/previewFixtures';

const SUPERVISOR_PREVIEW_LINK: FamilyLink = { id: 'supervisor-preview', status: 'active', counterpartName: 'Alex', canViewSharedWork: true };
const SUPERVISOR_PREVIEW_CASE: Case = {
  id: 'supervisor-preview-exam', userId: 'preview-learner', title: 'Thermodynamics Midterm', description: 'Shared preview exam', ref: 'SUP-DEMO-1', status: 'Draft Ready', progress: 100, evidenceLogged: true, facultyReview: false, createdAt: new Date(), updatedAt: new Date(),
  analysis: { ...PREVIEW_ANALYSIS, assignment: { ...PREVIEW_ANALYSIS.assignment, assignment_type: 'exam', title: 'Thermodynamics Midterm', total_score_display: '82 / 100' } },
};

type LearnerFocus = { label: string; evidence: string; exams: number };

function learnerFocus(cases: Case[]): LearnerFocus[] {
  const rows = new Map<string, LearnerFocus>();
  for (const item of cases) {
    for (const focus of item.analysis?.study_insights?.focus_areas ?? []) {
      if (!focus.skill?.trim() || !focus.evidence?.trim()) continue;
      const key = focus.skill.trim().toLowerCase();
      const existing = rows.get(key);
      rows.set(key, existing
        ? { ...existing, exams: existing.exams + 1 }
        : { label: focus.skill.trim(), evidence: focus.evidence.trim(), exams: 1 });
    }
  }
  return [...rows.values()].sort((a, b) => b.exams - a.exams).slice(0, 4);
}

function teacherEmail(item: Case, learnerName: string): string {
  const analysis = item.analysis;
  const assignment = analysis?.assignment.title || item.title;
  const points = analysis?.case_analysis.strongest_appeal_points?.slice(0, 2) ?? [];
  const reason = points.length
    ? points.map((point) => `- ${point}`).join('\n')
    : `- I would appreciate clarification on how the visible rubric and feedback were applied to ${assignment}.`;
  return `Subject: Request to review ${assignment}\n\nHello Professor,\n\nI’m writing with ${learnerName} about the marking on ${assignment}. We reviewed the returned work and would appreciate clarification on the following evidence:\n\n${reason}\n\nCould you please confirm how these marks align with the relevant rubric criteria? We are happy to follow the course’s official review process and provide the original marked copy.\n\nThank you for your time,\n${learnerName} and parent/supervisor`;
}

export default function SupervisorHub() {
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [code, setCode] = useState('');
  const [cases, setCases] = useState<Record<string, Case[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ link: FamilyLink; item: Case } | null>(null);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    if (isPreviewMode()) {
      setLinks([SUPERVISOR_PREVIEW_LINK]);
      setCases({ [SUPERVISOR_PREVIEW_LINK.id]: [SUPERVISOR_PREVIEW_CASE] });
      return;
    }
    const status = await familyService.status();
    setLinks(status.links);
    const active = status.links.filter((link) => link.status === 'active');
    const rows = await Promise.all(active.map(async (link) => [link.id, await familyService.sharedCases(link.id)] as const));
    setCases(Object.fromEntries(rows));
  };
  useEffect(() => { void refresh().catch(() => setLinks([])); }, []);

  const redeem = async () => {
    setBusy(true); setError(null);
    try { await familyService.redeem(code.replace(/\s/g, '').toUpperCase()); setCode(''); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not use that code.'); }
    finally { setBusy(false); }
  };
  const unlink = async (id: string) => {
    setBusy(true); setError(null);
    try { await familyService.unlink(id); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not remove connection.'); }
    finally { setBusy(false); }
  };
  const suggest = async (linkId: string, caseId: string) => {
    setBusy(true); setError(null);
    try { await familyService.suggestReview(linkId, caseId); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not suggest review.'); }
    finally { setBusy(false); }
  };

  const allActiveCases = useMemo(() => Object.values(cases).flat(), [cases]);
  const focus = useMemo(() => learnerFocus(allActiveCases), [allActiveCases]);
  const analyzedCount = allActiveCases.filter((item) => item.analysis).length;
  const reviewCount = allActiveCases.filter((item) => item.analysis?.case_analysis.overall_case_strength && item.analysis.case_analysis.overall_case_strength !== 'no_case').length;

  const prepareEmail = (link: FamilyLink, item: Case) => {
    setSelected({ link, item });
    setDraft(teacherEmail(item, link.counterpartName));
    setCopied(false);
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  };

  return <div className="space-y-7 pb-8">
    <section className="rounded-[24px] rg-glass-hero px-5 py-8 sm:px-7 sm:py-9">
      <MarketingEyebrow>supervised workspace</MarketingEyebrow>
      <h1 className="rg-serif mt-2 text-[clamp(32px,7vw,44px)] text-ink font-semibold leading-[1.05]">Learner support.</h1>
      <p className="mt-3 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed text-ink-muted">Understand where your learner needs help, review possible grading issues, and prepare a teacher message together.</p>
    </section>

    <section className="rg-glass-form-card p-5 space-y-3">
      <div><h2 className="text-[16px] font-semibold text-ink">Connect a learner</h2><p className="mt-1 text-[12px] text-ink-muted">Ask the learner to open Profile → Settings &amp; account → Generate pairing code.</p></div>
      <div className="flex gap-2"><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 8))} placeholder="8-character code" className="min-w-0 flex-1 rounded-xl border border-hairline bg-canvas px-3 py-2.5 font-mono tracking-wider text-ink outline-none focus:border-primary" /><button type="button" disabled={busy || code.replace(/\s/g, '').length !== 8} onClick={() => void redeem()} className="rg-btn-primary px-4 disabled:opacity-45">Connect</button></div>
      {error && <p className="text-[12px] text-red-700">{error}</p>}
    </section>

    {!links.length && <section className="rg-glass-form-card p-6 text-center space-y-3"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><ICONS.User className="h-6 w-6" /></div><h2 className="rg-serif text-xl text-ink font-semibold">No learner is connected yet.</h2><p className="text-[13px] text-ink-muted">Nothing is shared until the learner approves.</p></section>}

    {links.some((link) => link.status === 'active') && <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rg-glass-stat p-4"><p className="rg-meta-k">Analyzed work</p><p className="rg-serif mt-1 text-3xl text-ink">{analyzedCount}</p></div>
        <div className="rg-glass-stat p-4"><p className="rg-meta-k">Worth reviewing</p><p className="rg-serif mt-1 text-3xl text-primary">{reviewCount}</p></div>
        <div className="rg-glass-stat col-span-2 p-4 sm:col-span-1"><p className="rg-meta-k">Focus areas</p><p className="rg-serif mt-1 text-3xl text-ink">{focus.length}</p></div>
      </section>
      <section className="rg-glass-form-card p-5 space-y-3">
        <div><MarketingEyebrow>learning patterns</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink">Where support may help.</h2><p className="mt-1 text-[12px] text-ink-muted">Only patterns supported by the learner’s analyzed exam evidence appear here.</p></div>
        {focus.length ? <div className="grid gap-2 sm:grid-cols-2">{focus.map((item) => <article key={item.label} className="rounded-xl border border-hairline p-3"><div className="flex items-center justify-between gap-3"><p className="text-[13px] font-semibold text-ink">{item.label}</p><span className="text-[10px] font-semibold text-primary">{item.exams} exam{item.exams === 1 ? '' : 's'}</span></div><p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{item.evidence}</p></article>)}</div> : <p className="text-[12px] text-ink-muted">No recurring evidence-backed patterns yet.</p>}
      </section>
    </>}

    {links.map((link) => <section key={link.id} className="rg-glass-form-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3"><div><MarketingEyebrow>learner</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink font-semibold">{link.counterpartName}</h2><p className="mt-1 text-[12px] text-ink-muted">{link.status === 'active' ? 'Grades, analyzed exams, and appeal drafts shared with consent.' : 'Waiting for learner approval.'}</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${link.status === 'active' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-amber-500/10 text-amber-800'}`}>{link.status === 'active' ? 'Consent active' : 'Pending'}</span></div>
      {link.status === 'active' && <div className="space-y-2">{(cases[link.id] ?? []).map((item) => <article key={item.id} className="rounded-xl border border-hairline p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold text-ink">{item.analysis?.assignment.title || item.title}</p><p className="mt-0.5 text-[11px] text-ink-muted">{item.analysis?.assignment.subject || 'Course'} · {item.analysis?.assignment.total_score_display || item.status}</p></div><span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-semibold capitalize text-primary">{item.analysis?.case_analysis.overall_case_strength?.replace('_', ' ') || 'Review'}</span></div><p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{item.analysis?.case_analysis.case_strength_reason || 'Review the shared marked evidence before deciding what to do next.'}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy || !item.id} onClick={() => item.id && void suggest(link.id, item.id)} className="rg-btn-secondary px-3 py-2 text-[11px]">Send to learner for review</button><button type="button" onClick={() => prepareEmail(link, item)} className="rg-btn-primary px-3 py-2 text-[11px]"><ICONS.MessageSquare className="h-3.5 w-3.5" />Prepare teacher email</button></div></article>)}{!(cases[link.id] ?? []).length && <p className="text-[12px] text-ink-muted">No analyzed work has been shared yet.</p>}</div>}
      <button type="button" disabled={busy} onClick={() => void unlink(link.id)} className="rg-btn-ghost w-full text-red-600">Unlink</button>
    </section>)}

    {selected && <section className="rg-glass-form-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3"><div><MarketingEyebrow>teacher email</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink">Review before using.</h2><p className="mt-1 text-[12px] text-ink-muted">This draft uses the shared evidence from {selected.item.analysis?.assignment.title || selected.item.title}.</p></div><button type="button" onClick={() => setSelected(null)} className="rg-header-icon-btn h-8 w-8" aria-label="Close email draft"><ICONS.X className="h-4 w-4" /></button></div>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={14} className="w-full resize-y rounded-xl border border-hairline bg-canvas p-3 text-[13px] leading-relaxed text-ink outline-none focus:border-primary" />
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void copyDraft()} className="rg-btn-primary px-4 py-2.5 text-[12px]"><ICONS.Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy email'}</button><button type="button" disabled={busy || !selected.item.id} onClick={() => selected.item.id && void suggest(selected.link.id, selected.item.id)} className="rg-btn-secondary px-4 py-2.5 text-[12px]">Ask learner to approve review</button></div>
      <p className="text-[11px] leading-relaxed text-ink-muted">Regrade does not send this automatically. The learner should confirm the facts and follow the school’s official appeal process.</p>
    </section>}
    <p className="px-1 text-[12px] leading-relaxed text-ink-muted">Supervisors can understand shared evidence, help prepare an appeal, and draft an email. They cannot change a grade or send anything without review. The learner remains the final approver.</p>
  </div>;
}
