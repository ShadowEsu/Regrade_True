import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { auth } from '../lib/firebase';
import { isPreviewMode } from '../lib/previewMode';
import { caseService, Case } from '../services/caseService';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import SupportedPlatforms from '../components/SupportedPlatforms';
import {
  getPossiblePointsBack,
  getClassName,
  getScoreDisplay,
  getNextStep,
} from '../lib/appealHelpers';

const WHAT_IT_DOES = [
  {
    icon: ICONS.Search,
    title: 'Reads your rubric',
    body: 'Scores, deductions, and teacher comments — all in one pass.',
  },
  {
    icon: ICONS.Lightbulb,
    title: 'Finds your angle',
    body: 'Spots partial credit, missing explanations, and math errors.',
  },
  {
    icon: ICONS.Send,
    title: 'Writes the email',
    body: 'Polite, specific, professor-safe — yours to edit before sending.',
  },
] as const;

export default function Dashboard({
  onStartAppeal,
  onOpenChat,
  onOpenAppeal,
  onOpenSampleVerdict,
}: {
  onStartAppeal: () => void;
  onOpenChat: () => void;
  onOpenAppeal?: (caseId: string) => void;
  onOpenSampleVerdict?: () => void;
}) {
  const user = auth.currentUser;
  const firstName =
    user?.displayName?.split(' ')[0] ||
    (isPreviewMode() ? 'there' : user?.email?.split('@')[0]) ||
    'there';
  const [latestCase, setLatestCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        const cases = await caseService.getUserCases();
        if (cases.length > 0) setLatestCase(cases[0]);
      } catch (err) {
        console.error('Failed to load appeal records:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const pts = latestCase ? getPossiblePointsBack(latestCase) : 0;

  return (
    <div className="space-y-10 pb-4">
      <header className="text-center space-y-4 pt-2">
        <MarketingEyebrow>your record</MarketingEyebrow>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rg-serif text-[clamp(36px,9vw,48px)] text-ink font-semibold leading-[1.05] tracking-tight"
        >
          Welcome, {firstName}.
        </motion.h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-3"
      >
        <AnimatedPrimaryButton onClick={onStartAppeal} showPlus className="w-full">
          Start new appeal
        </AnimatedPrimaryButton>
        <motion.button
          type="button"
          onClick={onOpenChat}
          whileTap={{ scale: 0.97 }}
          className="rg-btn-ghost w-full py-3"
        >
          <ICONS.Lightbulb className="w-4 h-4" strokeWidth={2} />
          Ask AI coach
        </motion.button>
      </motion.div>

      {loading ? (
        <div className="rg-card p-5 space-y-3">
          <div className="h-3 w-24 rg-shimmer rounded mx-auto" />
          <div className="h-4 w-full rg-shimmer rounded" />
        </div>
      ) : latestCase ? (
        <section className="space-y-3">
          <div className="text-center">
            <MarketingEyebrow>active appeal</MarketingEyebrow>
          </div>
          <motion.button
            type="button"
            onClick={() => latestCase.id && onOpenAppeal?.(latestCase.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="rg-card rg-card-hover w-full text-left p-5 space-y-4"
          >
            <div className="text-center sm:text-left">
              <h2 className="rg-serif text-2xl text-ink font-semibold">{latestCase.title}</h2>
              <p className="rg-section-title mt-1">{getClassName(latestCase)}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1 border-t border-divider">
              <div className="text-center">
                <p className="rg-meta-k">Score</p>
                <p className="rg-meta-v">{getScoreDisplay(latestCase)}</p>
              </div>
              <div className="text-center">
                <p className="rg-meta-k">Recoverable</p>
                <p className="rg-meta-v text-primary">{pts > 0 ? `+${pts}` : '—'}</p>
              </div>
              <div className="text-center">
                <p className="rg-meta-k">Progress</p>
                <p className="rg-meta-v">{latestCase.progress}%</p>
              </div>
            </div>

            <p className="text-sm text-ink-muted text-center sm:text-left">
              Next: <span className="text-ink font-medium">{getNextStep(latestCase)}</span>
            </p>
          </motion.button>
        </section>
      ) : (
        <section className="rg-card p-6 text-center space-y-3">
          <MarketingEyebrow>get started</MarketingEyebrow>
          <p className="rg-serif text-2xl text-ink font-semibold">One upload. Sixty seconds.</p>
          <p className="rg-lead text-base max-w-xs mx-auto">
            Snap a photo or PDF from Canvas, Gradescope, or any gradebook.
          </p>
        </section>
      )}

      <section className="space-y-4">
        <div className="text-center">
          <MarketingEyebrow>what regrade does</MarketingEyebrow>
          <h2 className="rg-serif text-[clamp(22px,5vw,28px)] text-ink font-semibold mt-2">
            Three steps. Points back.
          </h2>
        </div>
        <div className="space-y-3">
          {WHAT_IT_DOES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              whileHover={{ x: 4 }}
              className="rg-insight flex items-start gap-4"
            >
              <div className="shrink-0 p-2.5 rounded-xl bg-primary/8 text-primary">
                <item.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-ink">{item.title}</p>
                <p className="text-[13px] text-muted mt-0.5 leading-relaxed">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {latestCase?.analysis && (
        <section className="space-y-3">
          <div className="text-center">
            <MarketingEyebrow>live</MarketingEyebrow>
          </div>
          <div className="rg-card divide-y divide-divider overflow-hidden">
            <MetaRow label="Case strength" value={latestCase.analysis.case_analysis.overall_case_strength} />
            <MetaRow label="Rubric scan" value="Complete" />
            {pts > 0 && <MetaRow label="Points at stake" value={`+${pts}`} highlight />}
          </div>
        </section>
      )}

      <SupportedPlatforms />

      {onOpenSampleVerdict && (
        <button type="button" onClick={onOpenSampleVerdict} className="rg-text-link text-sm w-full justify-center">
          {latestCase ? 'Preview sample analysis' : 'See a sample analysis'}{' '}
          <span aria-hidden>›</span>
        </button>
      )}
    </div>
  );
}

function MetaRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="rg-meta-k">{label}</span>
      <span className={`rg-meta-v capitalize ${highlight ? 'text-primary' : ''}`}>{value}</span>
    </div>
  );
}
