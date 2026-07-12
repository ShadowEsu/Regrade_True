import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import { EmptyState, FilterChips, MetricCard, PageHeader, PrimaryButton, Reveal, SearchField, StatusBadge } from '../components/mobile/MobilePrimitives';
import { caseService, Case } from '../services/caseService';
import {
  getPossiblePointsBack,
  getClassName,
  getScoreDisplay,
  getNextStep,
  formatCaseDate,
} from '../lib/appealHelpers';

export default function History({
  onStartAppeal,
  onOpenAppeal,
  onViewPaper,
}: {
  onStartAppeal: () => void;
  onOpenAppeal: (caseId: string) => void;
  onViewPaper?: (caseId: string) => void;
}) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCases(await caseService.getUserCases());
    } catch {
      setError('Could not load your appeal history. Check your connection and try again.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => { setVisibleCount(20); }, [search, status]);

  const deleteAppeal = async (item: Case) => {
    if (!item.id || !window.confirm(`Delete “${item.title}” and its uploaded paper? This cannot be undone.`)) return;
    setDeletingId(item.id);
    setActionError(null);
    try {
      await caseService.deleteCase(item.id);
      setCases((current) => current.filter((record) => record.id !== item.id));
      setExpandedId(null);
    } catch {
      setActionError('The exam could not be deleted. Your data is unchanged. Check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalRecoverable = cases.reduce((sum, c) => sum + getPossiblePointsBack(c), 0);
  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesSearch = !query || [item.title, getClassName(item), item.status, item.analysis?.assignment.subject].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || item.status?.toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  }, [cases, search, status]);
  const groupedCases = useMemo(() => {
    const groups = new Map<string, Case[]>();
    for (const item of filteredCases.slice(0, visibleCount)) {
      const raw = item.createdAt as unknown;
      const date = raw && typeof (raw as { toDate?: () => Date }).toDate === 'function' ? (raw as { toDate: () => Date }).toDate() : new Date(raw as string | number | Date);
      const key = Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Earlier';
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [filteredCases, visibleCount]);

  return (
    <div className="rg3-screen rg3-history-screen">
      <Reveal><PageHeader eyebrow="Your record" title="My history" subtitle="Every exam, draft, and outcome in one place." action={<ICONS.MoreHorizontal />} /></Reveal>

      {!loading && !error && cases.length > 0 && (
        <Reveal className="grid grid-cols-3 gap-2"><MetricCard value={totalRecoverable} label="Points identified" detail="Possible" tone="green" icon={<ICONS.TrendingUp />} /><MetricCard value={cases.filter((item) => Boolean(item.draftEmail)).length} label="Drafts saved" detail="Editable" tone="lavender" icon={<ICONS.Send />} /><MetricCard value={cases.filter((item) => item.status === 'Resolved').length} label="Outcomes" detail="Confirmed" tone="yellow" icon={<ICONS.Verified />} /></Reveal>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <BrandSpinner size={32} />
          <p className="rg-section-title">Loading your record…</p>
        </div>
      ) : error ? (
        <div className="rg-glass-card p-8 text-center space-y-4">
          <p className="text-[14px] text-red-600 font-medium">{error}</p>
          <button type="button" onClick={() => void loadHistory()} className="rg-btn-secondary px-4 py-2 text-[13px]">
            <ICONS.RefreshCcw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      ) : cases.length === 0 ? <EmptyState icon={<ICONS.History />} title="Nothing here yet" body="Imported exams, reviews, drafts, and confirmed outcomes will appear here." action="Start your first appeal" onAction={onStartAppeal} /> : (
        <div className="space-y-5">
          {actionError && <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3" role="alert"><p className="text-[12px] text-red-700">{actionError}</p><button type="button" onClick={() => setActionError(null)} className="shrink-0 text-[12px] font-semibold text-primary">Dismiss</button></div>}
          <SearchField value={search} onChange={setSearch} placeholder="Search exams, courses, or appeals" />
          <FilterChips value={status} onChange={setStatus} items={[{id:'all',label:'All'},{id:'draft ready',label:'Drafts'},{id:'under review',label:'In review'},{id:'resolved',label:'Outcomes'}]} />
          {groupedCases.map(([group, groupCases]) => <section key={group} className="space-y-3"><div className="flex items-center gap-3"><h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{group}</h2><span className="h-px flex-1 bg-hairline" /></div>{groupCases.map((appeal, idx) => {
            const pts = getPossiblePointsBack(appeal);
            const date = formatCaseDate(appeal.createdAt);
            const statusKey = appeal.status?.toLowerCase() ?? 'under review';
            const expanded = expandedId === appeal.id;

            return (
              <motion.article
                key={appeal.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                className={`rg3-history-record ${expanded ? 'is-expanded' : ''}`}
              >
                <button type="button" onClick={() => setExpandedId(expanded ? null : appeal.id ?? null)} aria-expanded={expanded} className="flex w-full items-start justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <h3>{appeal.analysis?.assignment.title || appeal.title}</h3>
                    <p className="text-sm text-ink-muted mt-0.5">{getClassName(appeal)}</p>
                    <p className="rg3-history-result">{pts > 0 ? `+${pts} possible point${pts === 1 ? '' : 's'}` : getNextStep(appeal)}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {date && (
                      <span className="text-[11px] font-mono text-ink-muted rg-glass-chip px-2 py-1">
                        {date}
                      </span>
                    )}
                    <ICONS.ChevronDown className={`w-4 h-4 text-primary transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={2} />
                  </div>
                </button>

                <div className="rg3-history-meta">
                  <StatusBadge tone={statusKey === 'resolved' ? 'green' : statusKey === 'draft ready' ? 'yellow' : 'blue'}>{appeal.status}</StatusBadge>
                  <span>{getScoreDisplay(appeal)}</span><span>{appeal.progress}% complete</span>
                  {appeal.draftEmail && (
                    <span className="rg-glass-chip px-3 py-1 text-[11px] text-emerald-700 border-emerald-500/20 bg-emerald-500/8">
                      Draft saved
                    </span>
                  )}
                </div>
                {expanded && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rg3-history-detail"><p>{appeal.analysis?.case_analysis.case_strength_reason || appeal.description || 'Open this record to review its evidence and saved draft.'}</p><div>{onViewPaper && (appeal.pageImages?.length || appeal.pageImageUrls?.length) && appeal.id && <button type="button" onClick={() => onViewPaper(appeal.id!)} className="rg3-secondary-button">Open exam</button>}<PrimaryButton onClick={() => appeal.id && onOpenAppeal(appeal.id)}>View appeal</PrimaryButton><button type="button" disabled={deletingId === appeal.id} onClick={() => void deleteAppeal(appeal)} className="rg3-delete-link">{deletingId === appeal.id ? 'Deleting…' : 'Delete'}</button></div></motion.div>}
              </motion.article>
            );
          })}</section>)}
          {visibleCount < filteredCases.length && <button type="button" onClick={() => setVisibleCount((count) => count + 20)} className="rg-btn-secondary mx-auto px-5 py-2.5 text-[13px]">Load 20 more</button>}
          {!filteredCases.length && <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-[13px] text-ink-muted">No appeals match those filters.</div>}
        </div>
      )}
    </div>
  );
}
