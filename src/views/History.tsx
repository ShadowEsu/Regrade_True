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
      <header className="text-center space-y-3">
        <MarketingEyebrow>your record</MarketingEyebrow>
        <h1 className="rg-serif text-[clamp(28px,6vw,36px)] text-ink font-semibold">Appeal history</h1>
        <p className="rg-lead text-base max-w-sm mx-auto">Points recovered, drafts saved, and outcomes.</p>
      </header>

      {!loading && cases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="rg-stat-tile text-center py-4">
            <p className="rg-serif text-3xl text-ink font-semibold">{cases.length}</p>
            <p className="text-[12px] font-medium text-ink mt-0.5">appeals</p>
          </div>
          <div className="rg-stat-tile text-center py-4">
            <p className="rg-serif text-3xl text-primary font-semibold">
              {totalRecoverable > 0 ? `+${totalRecoverable}` : '—'}
            </p>
            <p className="text-[12px] font-medium text-ink mt-0.5">pts flagged</p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <BrandSpinner size={32} />
          <p className="rg-section-title">Loading your record…</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="rg-card p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/8 flex items-center justify-center">
            <ICONS.History className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <p className="rg-serif text-2xl text-ink font-semibold">Nothing here yet.</p>
          <p className="rg-lead text-base max-w-xs mx-auto">
            Finished appeals show up with points recovered and draft status.
          </p>
          <AnimatedPrimaryButton onClick={onStartAppeal} showPlus className="max-w-xs mx-auto">
            Start your first appeal
          </AnimatedPrimaryButton>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((appeal, idx) => {
            const pts = getPossiblePointsBack(appeal);
            const date = formatCaseDate(appeal.createdAt);

            return (
              <motion.div
                key={appeal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.35 }}
                whileHover={{ y: -2 }}
                className="rg-card p-4 border-l-[3px] border-l-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="rg-serif text-lg text-ink font-semibold truncate">{appeal.title}</h3>
                    <p className="text-sm text-muted mt-0.5">{getClassName(appeal)}</p>
                  </div>
                  {date && (
                    <span className="text-[11px] font-mono text-muted shrink-0 pt-1">{date}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-divider">
                  <span className="rg-pill px-3 py-1 text-[11px] capitalize text-ink-muted">
                    {appeal.status}
                  </span>
                  <span className="rg-pill px-3 py-1 text-[11px] text-ink-muted">
                    {appeal.progress}% done
                  </span>
                  {pts > 0 && (
                    <span className="rg-pill px-3 py-1 text-[11px] text-primary font-semibold bg-primary/8 border-primary/20">
                      +{pts} pts
                    </span>
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
