import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import { caseService, Case } from '../services/caseService';
import {
  getPossiblePointsBack,
  getClassName,
  getScoreDisplay,
  getNextStep,
  formatCaseDate,
} from '../lib/appealHelpers';

const STATUS_TINT: Record<string, string> = {
  'draft ready': 'text-amber-800 bg-amber-500/12 border-amber-500/20',
  'under review': 'text-primary bg-primary/10 border-primary/20',
  resolved: 'text-emerald-800 bg-emerald-500/12 border-emerald-500/20',
};

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

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCases(await caseService.getUserCases());
    } catch (err) {
      console.error('Failed to load appeal history:', err);
      setError('Could not load your appeal history. Check your connection and try again.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

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
    for (const item of filteredCases) {
      const raw = item.createdAt as unknown;
      const date = raw && typeof (raw as { toDate?: () => Date }).toDate === 'function' ? (raw as { toDate: () => Date }).toDate() : new Date(raw as string | number | Date);
      const key = Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Earlier';
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [filteredCases]);

  return (
    <div className="space-y-8 pb-4">
      <section className="relative overflow-hidden rounded-[22px] rg-glass-hero px-5 py-8 sm:px-7 sm:py-9 text-center">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-primary/12 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute -bottom-14 -left-8 w-40 h-40 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="relative space-y-3">
          <MarketingEyebrow>your record</MarketingEyebrow>
          <h1 className="rg-serif text-[clamp(30px,6vw,42px)] text-ink font-semibold">Appeal history.</h1>
          <p className="rg-lead text-[15px] max-w-sm mx-auto">
            Points recovered, drafts saved, and outcomes — all in one place.
          </p>
        </div>
      </section>

      {!loading && !error && cases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { value: String(cases.length), label: 'appeals', accent: false },
            { value: totalRecoverable > 0 ? `+${totalRecoverable}` : '—', label: 'pts flagged', accent: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3, scale: 1.03 }}
              className="rg-glass-stat text-center py-5"
            >
              <p className={`rg-serif text-3xl font-semibold ${stat.accent ? 'text-primary' : 'text-ink'}`}>
                {stat.value}
              </p>
              <p className="text-[12px] font-medium text-ink mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
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
      ) : cases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rg-glass-card p-8 sm:p-10 text-center space-y-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-violet-500/[0.05] pointer-events-none" aria-hidden />
          <div className="relative w-16 h-16 mx-auto rounded-2xl rg-glass flex items-center justify-center">
            <ICONS.History className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="relative space-y-2">
            <p className="rg-serif text-2xl text-ink font-semibold">Nothing here yet.</p>
            <p className="rg-lead text-[15px] max-w-xs mx-auto">
              Finished appeals show up with points recovered and draft status.
            </p>
          </div>
          <AnimatedPrimaryButton onClick={onStartAppeal} showPlus className="max-w-xs mx-auto relative">
            Start your first appeal
          </AnimatedPrimaryButton>
        </motion.div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-2 rounded-xl border border-hairline bg-canvas p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block"><span className="sr-only">Search appeal history</span><ICONS.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search appeal, course, or subject" className="h-10 w-full rounded-lg border border-hairline bg-parchment pl-9 pr-3 text-[13px] text-ink outline-none focus:border-primary" /></label>
            <select aria-label="Filter history by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-hairline bg-canvas px-3 text-[13px] text-ink outline-none focus:border-primary"><option value="all">All statuses</option><option value="draft ready">Draft ready</option><option value="under review">Under review</option><option value="resolved">Resolved</option></select>
          </div>
          {groupedCases.map(([group, groupCases]) => <section key={group} className="space-y-3"><div className="flex items-center gap-3"><h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{group}</h2><span className="h-px flex-1 bg-hairline" /></div>{groupCases.map((appeal, idx) => {
            const pts = getPossiblePointsBack(appeal);
            const date = formatCaseDate(appeal.createdAt);
            const statusKey = appeal.status?.toLowerCase() ?? 'under review';
            const statusTint = STATUS_TINT[statusKey] ?? 'text-ink-muted bg-parchment border-hairline';
            const expanded = expandedId === appeal.id;

            return (
              <motion.article
                key={appeal.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                className="w-full rounded-xl border border-hairline bg-canvas p-4 text-left"
              >
                <button type="button" onClick={() => setExpandedId(expanded ? null : appeal.id ?? null)} aria-expanded={expanded} className="flex w-full items-start justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <h3 className="rg-serif text-lg text-ink font-semibold truncate">{appeal.title}</h3>
                    <p className="text-sm text-ink-muted mt-0.5">{getClassName(appeal)}</p>
                    <p className="text-sm text-ink-muted mt-2">
                      Score <span className="text-ink font-medium">{getScoreDisplay(appeal)}</span>
                      {pts > 0 && (
                        <span className="text-primary font-medium ml-3">+{pts} pts</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted mt-1.5">
                      Next: <span className="text-ink">{getNextStep(appeal)}</span>
                    </p>
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

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-hairline">
                  <span className={`rg-glass-chip px-3 py-1 text-[11px] capitalize font-medium border ${statusTint}`}>
                    {appeal.status}
                  </span>
                  <span className="rg-glass-chip px-3 py-1 text-[11px] text-ink-muted">
                    {appeal.progress}% done
                  </span>
                  {appeal.draftEmail && (
                    <span className="rg-glass-chip px-3 py-1 text-[11px] text-emerald-700 border-emerald-500/20 bg-emerald-500/8">
                      Draft saved
                    </span>
                  )}
                </div>
                {expanded && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4"><p className="mr-auto max-w-md text-[12px] leading-relaxed text-ink-muted">{appeal.analysis?.case_analysis.case_strength_reason || appeal.description || 'Open the appeal to review the evidence and saved draft.'}</p>{onViewPaper && (appeal.pageImages?.length || appeal.pageImageUrls?.length) && appeal.id && <button type="button" onClick={() => onViewPaper(appeal.id!)} className="rg-btn-secondary px-3 py-2 text-[12px]"><ICONS.FileText className="h-3.5 w-3.5" />View paper</button>}<button type="button" onClick={() => appeal.id && onOpenAppeal(appeal.id)} className="rg-btn-primary px-3 py-2 text-[12px]">Open appeal<ICONS.ArrowRight className="h-3.5 w-3.5" /></button></motion.div>}
              </motion.article>
            );
          })}</section>)}
          {!filteredCases.length && <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-[13px] text-ink-muted">No appeals match those filters.</div>}
        </div>
      )}
    </div>
  );
}
