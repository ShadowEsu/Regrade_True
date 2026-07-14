import { useEffect, useMemo, useState } from 'react';
import { ICONS } from '../constants';
import MarketingEyebrow from '../components/MarketingEyebrow';
import { familyService, type FamilyLink } from '../services/familyService';
import type { Case } from '../services/caseService';
import { EmptyState, MetricCard, Reveal, StatusBadge, SurfaceCard } from '../components/mobile/MobilePrimitives';
import { auth } from '../lib/firebase';
import { userService, type AccountRole } from '../services/userService';
import { DEFAULT_AVATAR_SRC } from '../constants';

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
  const [query, setQuery] = useState('');
  const [learnerFilter, setLearnerFilter] = useState<'all' | 'attention' | 'active' | 'pending'>('all');
  const [pinnedLearners, setPinnedLearners] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('regrade.family.pinnedLearners') || '[]') as string[]; }
    catch { return []; }
  });
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(() => localStorage.getItem('regrade.family.selectedLink'));
  const [supervisorRole, setSupervisorRole] = useState<AccountRole>('parent');

  const refresh = async () => {
    const status = await familyService.status();
    setLinks(status.links);
    setSelectedLinkId((current) => current && status.links.some((link) => link.id === current) ? current : status.links.find((link) => link.status === 'active')?.id ?? status.links[0]?.id ?? null);
    const active = status.links.filter((link) => link.status === 'active');
    const rows = await Promise.all(active.map(async (link) => [
      link.id,
      await familyService.sharedCases(link.id).catch(() => []),
    ] as const));
    setCases(Object.fromEntries(rows));
  };
  useEffect(() => {
    void refresh().catch(() => setLinks([]));
    const user = auth.currentUser;
    if (user) void userService.getProfile(user.uid).then((profile) => setSupervisorRole(profile?.accountRole === 'teacher' ? 'teacher' : 'parent')).catch(() => undefined);
  }, []);

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

  const selectedLink = links.find((link) => link.id === selectedLinkId) ?? null;
  const filteredLinks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return links
      .filter((link) => !normalized || [link.counterpartName, link.gradeLevel, link.school, link.status].some((value) => value?.toLowerCase().includes(normalized)))
      .filter((link) => learnerFilter === 'all'
        || (learnerFilter === 'attention' && ((cases[link.id] ?? []).some((item) => item.analysis?.case_analysis.overall_case_strength !== 'no_case')))
        || (learnerFilter === 'active' && link.status === 'active')
        || (learnerFilter === 'pending' && link.status === 'pending'))
      .sort((a, b) => Number(pinnedLearners.includes(b.id)) - Number(pinnedLearners.includes(a.id)) || a.counterpartName.localeCompare(b.counterpartName));
  }, [cases, learnerFilter, links, pinnedLearners, query]);
  const allActiveCases = useMemo(() => selectedLink ? cases[selectedLink.id] ?? [] : [], [cases, selectedLink]);
  const focus = useMemo(() => learnerFocus(allActiveCases), [allActiveCases]);
  const analyzedCount = allActiveCases.filter((item) => item.analysis).length;
  const reviewCount = allActiveCases.filter((item) => item.analysis?.case_analysis.overall_case_strength && item.analysis.case_analysis.overall_case_strength !== 'no_case').length;

  const prepareEmail = (link: FamilyLink, item: Case) => {
    setSelected({ link, item });
    setDraft(teacherEmail(item, link.counterpartName));
    setCopied(false);
  };

  const togglePinned = (linkId: string) => {
    setPinnedLearners((current) => {
      const next = current.includes(linkId) ? current.filter((id) => id !== linkId) : [...current, linkId];
      localStorage.setItem('regrade.family.pinnedLearners', JSON.stringify(next));
      return next;
    });
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  };

  return <div className="space-y-7 pb-8">
    <Reveal><section className="space-y-2 pt-1"><MarketingEyebrow>{supervisorRole === 'teacher' ? 'teacher workspace' : 'family workspace'}</MarketingEyebrow><h1 className="rg-serif text-[clamp(32px,8vw,44px)] text-ink font-semibold leading-[1.05]">Learner support.</h1><p className="max-w-2xl text-[13px] leading-relaxed text-ink-muted">Switch learners without changing accounts. Only approved exam evidence appears.</p></section></Reveal>

    <SurfaceCard className="p-5 space-y-3">
      <div><h2 className="text-[16px] font-semibold text-ink">Connect a learner</h2><p className="mt-1 text-[12px] text-ink-muted">Ask the learner to open Profile → Settings &amp; account → Generate pairing code.</p></div>
      <div className="grid w-full min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 8))} placeholder="8-character code" className="w-full min-w-0 rounded-xl border border-hairline bg-canvas px-3 py-2.5 font-mono tracking-wider text-ink outline-none focus:border-primary" /><button type="button" disabled={busy || code.replace(/\s/g, '').length !== 8} onClick={() => void redeem()} className="rg-btn-primary w-full px-4 disabled:opacity-45 sm:w-auto">Connect</button></div>
      {error && <p className="text-[12px] text-red-700">{error}</p>}
    </SurfaceCard>

    {!links.length && <EmptyState icon={<ICONS.User />} title="No learner is connected yet." body="Nothing is shared until the learner generates a code and explicitly approves your access." />}

    {!!links.length && <SurfaceCard className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-3"><div><MarketingEyebrow>learners</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink">Choose a learner</h2></div><StatusBadge tone="blue">{links.length} linked</StatusBadge></div>
      <label className="relative block"><span className="sr-only">Search learners</span><ICONS.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, grade, or school" className="h-11 w-full rounded-xl border border-hairline bg-canvas pl-9 pr-3 text-[13px] text-ink outline-none focus:border-primary" /></label>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter learners">
        {(['all', 'attention', 'active', 'pending'] as const).map((filter) => <button key={filter} type="button" aria-pressed={learnerFilter === filter} onClick={() => setLearnerFilter(filter)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize ${learnerFilter === filter ? 'border-primary bg-primary text-white' : 'border-hairline bg-canvas text-ink-muted'}`}>{filter}</button>)}
      </div>
      <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
        {filteredLinks.map((link) => <div key={link.id} className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${selectedLinkId === link.id ? 'border-primary bg-primary/[0.06]' : 'border-hairline bg-canvas'}`}><button type="button" onClick={() => { setSelectedLinkId(link.id); localStorage.setItem('regrade.family.selectedLink', link.id); }} className="flex min-w-0 flex-1 items-center gap-3 p-1 text-left">
          <img src={link.counterpartAvatarUrl || DEFAULT_AVATAR_SRC} alt="" className="h-10 w-10 rounded-full object-cover" />
          <span className="min-w-0 flex-1"><strong className="block truncate text-[13px] text-ink">{link.counterpartName}</strong><small className="block truncate text-[11px] text-ink-muted">{[link.gradeLevel, link.school].filter(Boolean).join(' · ') || (link.status === 'active' ? 'Linked learner' : 'Awaiting approval')}</small></span>
          <StatusBadge tone={link.status === 'active' ? 'green' : 'yellow'}>{link.status === 'active' ? `${(cases[link.id] ?? []).length} exams` : 'Pending'}</StatusBadge>
        </button><button type="button" onClick={() => togglePinned(link.id)} aria-label={`${pinnedLearners.includes(link.id) ? 'Unpin' : 'Pin'} ${link.counterpartName}`} aria-pressed={pinnedLearners.includes(link.id)} className={`rounded-lg px-2 py-2 text-[14px] ${pinnedLearners.includes(link.id) ? 'text-amber-600' : 'text-ink-muted'}`}>{pinnedLearners.includes(link.id) ? '★' : '☆'}</button></div>)}
        {!filteredLinks.length && <p className="col-span-full px-2 py-4 text-center text-[12px] text-ink-muted">No learners match this search or filter.</p>}
      </div>
    </SurfaceCard>}

    {links.some((link) => link.status === 'active') && <>
      <section className="grid grid-cols-3 gap-2"><MetricCard value={analyzedCount} label="Analyzed" detail="Shared work" icon={<ICONS.BookOpen />} /><MetricCard value={reviewCount} label="Review" detail="Possible issues" tone="yellow" icon={<ICONS.Search />} /><MetricCard value={focus.length} label="Focus areas" detail="Evidence based" tone="lavender" icon={<ICONS.Lightbulb />} /></section>
      <section className="rg-glass-form-card p-5 space-y-3">
        <div><MarketingEyebrow>learning patterns</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink">Where support may help.</h2><p className="mt-1 text-[12px] text-ink-muted">Only patterns supported by the learner’s analyzed exam evidence appear here.</p></div>
        {focus.length ? <div className="grid gap-2 sm:grid-cols-2">{focus.map((item) => <article key={item.label} className="rounded-xl border border-hairline p-3"><div className="flex items-center justify-between gap-3"><p className="text-[13px] font-semibold text-ink">{item.label}</p><span className="text-[10px] font-semibold text-primary">{item.exams} exam{item.exams === 1 ? '' : 's'}</span></div><p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{item.evidence}</p></article>)}</div> : <p className="text-[12px] text-ink-muted">No recurring evidence-backed patterns yet.</p>}
      </section>
    </>}

    {selectedLink && [selectedLink].map((link) => <SurfaceCard key={link.id} className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3"><div><MarketingEyebrow>learner</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink font-semibold">{link.counterpartName}</h2><p className="mt-1 text-[12px] text-ink-muted">{link.status === 'active' ? 'Grades, analyzed exams, and appeal drafts shared with consent.' : 'Waiting for learner approval.'}</p></div><StatusBadge tone={link.status === 'active' ? 'green' : 'yellow'}>{link.status === 'active' ? 'Consent active' : 'Pending'}</StatusBadge></div>
      {link.status === 'active' && <div className="space-y-2">{(cases[link.id] ?? []).map((item) => <article key={item.id} className="rounded-xl border border-hairline p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold text-ink">{item.analysis?.assignment.title || item.title}</p><p className="mt-0.5 text-[11px] text-ink-muted">{item.analysis?.assignment.subject || 'Course'} · {item.analysis?.assignment.total_score_display || item.status}</p></div><span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-semibold capitalize text-primary">{item.analysis?.case_analysis.overall_case_strength?.replace('_', ' ') || 'Review'}</span></div><p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{item.analysis?.case_analysis.case_strength_reason || 'Review the shared marked evidence before deciding what to do next.'}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy || !item.id} onClick={() => item.id && void suggest(link.id, item.id)} className="rg-btn-secondary px-3 py-2 text-[11px]">Send to learner for review</button><button type="button" onClick={() => prepareEmail(link, item)} className="rg-btn-primary px-3 py-2 text-[11px]"><ICONS.MessageSquare className="h-3.5 w-3.5" />Prepare teacher email</button></div></article>)}{!(cases[link.id] ?? []).length && <p className="text-[12px] text-ink-muted">No analyzed work has been shared yet.</p>}</div>}
      <button type="button" disabled={busy} onClick={() => void unlink(link.id)} className="rg-btn-ghost w-full text-red-600">Unlink</button>
    </SurfaceCard>)}

    {selected && <section className="rg-glass-form-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3"><div><MarketingEyebrow>teacher email</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink">Review before using.</h2><p className="mt-1 text-[12px] text-ink-muted">This draft uses the shared evidence from {selected.item.analysis?.assignment.title || selected.item.title}.</p></div><button type="button" onClick={() => setSelected(null)} className="rg-header-icon-btn h-8 w-8" aria-label="Close email draft"><ICONS.X className="h-4 w-4" /></button></div>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={14} className="w-full resize-y rounded-xl border border-hairline bg-canvas p-3 text-[13px] leading-relaxed text-ink outline-none focus:border-primary" />
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void copyDraft()} className="rg-btn-primary px-4 py-2.5 text-[12px]"><ICONS.Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy email'}</button><button type="button" disabled={busy || !selected.item.id} onClick={() => selected.item.id && void suggest(selected.link.id, selected.item.id)} className="rg-btn-secondary px-4 py-2.5 text-[12px]">Ask learner to approve review</button></div>
      <p className="text-[11px] leading-relaxed text-ink-muted">Regrade does not send this automatically. The learner should confirm the facts and follow the school’s official appeal process.</p>
    </section>}
    <p className="px-1 text-[12px] leading-relaxed text-ink-muted">Supervisors can understand shared evidence, help prepare an appeal, and draft an email. They cannot change a grade or send anything without review. The learner remains the final approver.</p>
  </div>;
}
