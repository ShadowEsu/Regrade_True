import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import { caseService, Case } from '../services/caseService';
import {
  getPossiblePointsBack,
  getClassName,
  formatCaseDate,
} from '../lib/appealHelpers';

const STATUS_TINT: Record<string, string> = {
  draft: 'text-amber-800 bg-amber-500/12 border-amber-500/20',
  submitted: 'text-primary bg-primary/10 border-primary/20',
  complete: 'text-emerald-800 bg-emerald-500/12 border-emerald-500/20',
};

export default function History({ onStartAppeal }: { onStartAppeal: () => void }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setCases(await caseService.getUserCases());
      } catch (err) {
        console.error('Failed to load appeal history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const totalRecoverable = cases.reduce((sum, c) => sum + getPossiblePointsBack(c), 0);

  return (
    <div className="space-y-8 pb-4">
      <section className="relative overflow-hidden rounded-[22px] rg-glass-hero px-5 py-8 sm:px-7 sm:py-9 text-center">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-primary/12 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute -bottom-14 -left-8 w-40 h-40 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="relative space-y-3">
          <MarketingEyebrow>your record</MarketingEyebrow>
          <h1 className="rg-serif text-[clamp(28px,6vw,38px)] text-ink font-semibold">Appeal history</h1>
          <p className="rg-lead text-[15px] max-w-sm mx-auto">
            Points recovered, drafts saved, and outcomes — all in one place.
          </p>
        </div>
      </section>

      {!loading && cases.length > 0 && (
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
        <div className="space-y-3">
          {cases.map((appeal, idx) => {
            const pts = getPossiblePointsBack(appeal);
            const date = formatCaseDate(appeal.createdAt);
            const statusKey = appeal.status?.toLowerCase() ?? 'draft';
            const statusTint = STATUS_TINT[statusKey] ?? 'text-ink-muted bg-parchment border-hairline';

            return (
              <motion.div
                key={appeal.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 26 }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="rg-glass-card p-4 border-l-[3px] border-l-primary/50 cursor-default"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="rg-serif text-lg text-ink font-semibold truncate">{appeal.title}</h3>
                    <p className="text-sm text-muted mt-0.5">{getClassName(appeal)}</p>
                  </div>
                  {date && (
                    <span className="text-[11px] font-mono text-muted shrink-0 pt-1 rg-glass-chip px-2 py-1">
                      {date}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/50">
                  <span className={`rg-glass-chip px-3 py-1 text-[11px] capitalize font-medium border ${statusTint}`}>
                    {appeal.status}
                  </span>
                  <span className="rg-glass-chip px-3 py-1 text-[11px] text-ink-muted">
                    {appeal.progress}% done
                  </span>
                  {pts > 0 && (
                    <motion.span
                      whileHover={{ scale: 1.06 }}
                      className="rg-glass-chip px-3 py-1 text-[11px] text-primary font-semibold border-primary/25 bg-primary/8"
                    >
                      +{pts} pts
                    </motion.span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
