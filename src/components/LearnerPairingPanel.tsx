import { useEffect, useState } from 'react';
import { familyService, type FamilyLink } from '../services/familyService';

export default function LearnerPairingPanel() {
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [code, setCode] = useState<{ value: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => familyService.status().then((value) => setLinks(value.links)).catch(() => setLinks([]));
  useEffect(() => { void refresh(); }, []);
  const generate = async () => { setBusy(true); setError(null); try { const value = await familyService.createCode(); setCode({ value: value.code, expiresAt: value.expiresAt }); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create code.'); } finally { setBusy(false); } };
  const approve = async (id: string) => { setBusy(true); try { await familyService.approve(id); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not approve.'); } finally { setBusy(false); } };
  const unlink = async (id: string) => { setBusy(true); try { await familyService.unlink(id); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not unlink.'); } finally { setBusy(false); } };
  const acknowledge = async (linkId: string, suggestionId: string) => { setBusy(true); try { await familyService.acknowledgeSuggestion(linkId, suggestionId); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not acknowledge suggestion.'); } finally { setBusy(false); } };
  return <div className="rg-glass-card p-5 space-y-4">
    <div><p className="rg-meta-k">Learner sharing</p><h3 className="mt-1 text-[16px] font-semibold text-ink">Connect a parent or teacher</h3><p className="mt-1 text-[12px] leading-relaxed text-ink-muted">Generate a 10-minute code. The supervisor enters it, then you must approve on this device before anything is shared.</p></div>
    {code && <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-4 text-center"><p className="font-mono text-2xl tracking-[0.22em] text-primary">{code.value}</p><p className="mt-1 text-[11px] text-ink-muted">Expires {new Date(code.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div>}
    <button type="button" disabled={busy} onClick={() => void generate()} className="rg-btn-secondary w-full">{code ? 'Replace pairing code' : 'Generate pairing code'}</button>
    {links.map((link) => <div key={link.id} className="rounded-xl border border-hairline p-3 space-y-2"><div className="flex items-center justify-between gap-3"><div><p className="text-[13px] font-semibold text-ink">{link.counterpartName}</p><p className="text-[11px] text-ink-muted">{link.status === 'active' ? 'Sharing active' : 'Waiting for your approval'}</p></div><div className="flex gap-2">{link.status === 'pending' && <button type="button" disabled={busy} onClick={() => void approve(link.id)} className="text-[11px] font-semibold text-primary">Approve</button>}<button type="button" disabled={busy} onClick={() => void unlink(link.id)} className="text-[11px] font-semibold text-red-600">Remove</button></div></div>{link.suggestions?.map((suggestion) => <div key={suggestion.id} className="rounded-lg bg-primary/[0.05] p-2.5"><p className="text-[12px] font-semibold text-ink">Review suggested: {suggestion.title}</p><p className="mt-0.5 text-[11px] text-ink-muted">Your supervisor suggested opening this existing assessment. No duplicate appeal was created and nothing was sent.</p><button type="button" disabled={busy} onClick={() => void acknowledge(link.id, suggestion.id)} className="mt-1 text-[11px] font-semibold text-primary">Got it</button></div>)}</div>)}
    {error && <p className="text-[12px] text-red-700">{error}</p>}
  </div>;
}
