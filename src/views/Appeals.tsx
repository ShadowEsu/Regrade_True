import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import AppealCard from '../components/AppealCard';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import { caseService, Case } from '../services/caseService';

const STEPS = [
  { icon: ICONS.Upload, label: 'Upload', color: 'bg-blue-500/10 text-primary' },
  { icon: ICONS.Search, label: 'Analyze', color: 'bg-violet-500/10 text-violet-700' },
  { icon: ICONS.Edit3, label: 'Annotate', color: 'bg-amber-500/10 text-amber-700' },
  { icon: ICONS.ShieldCheck, label: 'Evidence', color: 'bg-cyan-500/10 text-cyan-700' },
  { icon: ICONS.Send, label: 'Draft', color: 'bg-emerald-500/10 text-emerald-700' },
] as const;

export default function Appeals({
  onStartNew,
  onOpenAppeal,
}: {
  onStartNew: () => void;
  onOpenAppeal: (caseId: string) => void;
}) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        setCases(await caseService.getUserCases());
      } catch {
        setLoadError('Your saved appeals could not be loaded. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadAttempt]);

  return (
    <div className="space-y-8 pb-6">
      {/* Hero */}
      <section className="rg2-card overflow-hidden px-5 py-8 sm:px-8 sm:py-10">
        <div className="space-y-5 text-center">
          <MarketingEyebrow>Appeal · new review</MarketingEyebrow>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rg-serif text-[clamp(28px,7vw,38px)] text-ink font-bold leading-[1.06] tracking-tight"
          >
            Review a grade<br />with evidence.
          </motion.h1>
          <p className="rg-lead text-[15px] sm:text-[16px] font-medium max-w-sm mx-auto">
            Upload the marked work. Regrade organizes what is visible, what needs clarification, and what belongs in a respectful draft.
          </p>

          {/* Mini flow graphic */}
          <div className="rg2-appeal-stepper pt-2" aria-label="Appeal steps">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex min-w-0 flex-1 items-center gap-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-3 ${step.color}`}
                >
                  <step.icon className="w-5 h-5" strokeWidth={1.75} />
                  <span className="truncate text-[9px] font-semibold">{step.label}</span>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <span className="h-px w-2 shrink-0 bg-hairline" aria-hidden />
                )}
              </div>
            ))}
          </div>

          <AnimatedPrimaryButton onClick={onStartNew} showPlus hero className="max-w-xs mx-auto">
            Start an appeal
          </AnimatedPrimaryButton>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <BrandSpinner size={28} />
          <p className="rg-section-title">One moment…</p>
        </div>
      ) : loadError ? (
        <section className="rg-card p-6 text-center space-y-4" role="alert">
          <p className="text-sm text-ink-muted">{loadError}</p>
          <button type="button" className="rg-action-button mx-auto" onClick={() => setLoadAttempt((value) => value + 1)}>Retry</button>
        </section>
      ) : cases.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <MarketingEyebrow>saved</MarketingEyebrow>
              <h2 className="rg-serif text-lg mt-2">Your appeals</h2>
              <p className="text-sm text-ink-muted mt-0.5">
                {cases.length} case{cases.length === 1 ? '' : 's'} — tap to continue
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {cases.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rg-card overflow-hidden border-l-[3px] border-l-primary/50"
              >
                <AppealCard appeal={c} onOpen={onOpenAppeal} flat />
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
