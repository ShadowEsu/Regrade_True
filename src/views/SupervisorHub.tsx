import { useEffect, useState } from 'react';
import { ICONS } from '../constants';
import MarketingEyebrow from '../components/MarketingEyebrow';
import { familyService, type FamilyLink } from '../services/familyService';
import type { Case } from '../services/caseService';

export default function SupervisorHub() {
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [code, setCode] = useState('');
  const [cases, setCases] = useState<Record<string, Case[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
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

  return <div className="space-y-7 pb-8">
    <section className="rounded-[24px] rg-glass-hero px-5 py-8 sm:px-7 sm:py-9">
      <MarketingEyebrow>supervised workspace</MarketingEyebrow>
      <h1 className="rg-serif mt-2 text-[clamp(30px,7vw,42px)] text-ink font-semibold leading-[1.05]">Support the learner. Keep them in control.</h1>
      <p className="mt-3 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed text-ink-muted">Enter the learner’s short-lived code. The learner must approve on their own device before grades or appeal findings become visible.</p>
    </section>

    <section className="rg-glass-form-card p-5 space-y-3">
      <div><h2 className="text-[16px] font-semibold text-ink">Connect a learner</h2><p className="mt-1 text-[12px] text-ink-muted">Ask the learner to open Profile → Settings &amp; account → Generate pairing code.</p></div>
      <div className="flex gap-2"><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 8))} placeholder="8-character code" className="min-w-0 flex-1 rounded-xl border border-hairline bg-canvas px-3 py-2.5 font-mono tracking-wider text-ink outline-none focus:border-primary" /><button type="button" disabled={busy || code.replace(/\s/g, '').length !== 8} onClick={() => void redeem()} className="rg-btn-primary px-4 disabled:opacity-45">Connect</button></div>
      {error && <p className="text-[12px] text-red-700">{error}</p>}
    </section>

    {!links.length && <section className="rg-glass-form-card p-6 text-center space-y-3"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><ICONS.User className="h-6 w-6" /></div><h2 className="rg-serif text-xl text-ink font-semibold">No learner is connected yet.</h2><p className="text-[13px] text-ink-muted">Nothing is shared until the learner approves.</p></section>}

    {links.map((link) => <section key={link.id} className="rg-glass-form-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3"><div><MarketingEyebrow>learner</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink font-semibold">{link.counterpartName}</h2><p className="mt-1 text-[12px] text-ink-muted">{link.status === 'active' ? 'Grades, analyzed exams, and appeal drafts shared with consent.' : 'Waiting for learner approval.'}</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${link.status === 'active' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-amber-500/10 text-amber-800'}`}>{link.status === 'active' ? 'Consent active' : 'Pending'}</span></div>
      {link.status === 'active' && <div className="space-y-2">{(cases[link.id] ?? []).map((item) => <article key={item.id} className="rounded-xl border border-hairline p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-[13px] font-semibold text-ink">{item.analysis?.assignment.title || item.title}</p><p className="text-[11px] text-ink-muted">{item.analysis?.assignment.total_score_display || item.status}</p></div><span className="text-[11px] font-medium text-primary">{item.analysis?.case_analysis.overall_case_strength?.replace('_', ' ') || 'Review'}</span></div><button type="button" disabled={busy} onClick={() => void suggest(link.id, item.id)} className="mt-2 text-[11px] font-semibold text-primary">Suggest learner review</button></article>)}{!(cases[link.id] ?? []).length && <p className="text-[12px] text-ink-muted">No analyzed work has been shared yet.</p>}</div>}
      <button type="button" disabled={busy} onClick={() => void unlink(link.id)} className="rg-btn-ghost w-full text-red-600">Unlink</button>
    </section>)}
    <p className="px-1 text-[12px] leading-relaxed text-ink-muted">Supervisors can review shared evidence and help prepare wording, but cannot connect the learner’s school account, submit an appeal, or change a grade. The learner remains the final approver.</p>
  </div>;
}
