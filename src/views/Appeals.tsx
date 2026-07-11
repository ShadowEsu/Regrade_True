import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import AppealCard from '../components/AppealCard';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import { caseService, Case } from '../services/caseService';

const STEPS = [
  { icon: ICONS.Upload, label: 'Upload', sub: 'Rubric + feedback', color: 'bg-blue-500/10 text-primary' },
  { icon: ICONS.Search, label: 'Analyze', sub: 'Spot mismatches', color: 'bg-violet-500/10 text-violet-700' },
  { icon: ICONS.Send, label: 'Draft', sub: 'Professor-safe email', color: 'bg-emerald-500/10 text-emerald-700' },
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

  useEffect(() => {
    async function load() {
      try {
        setCases(await caseService.getUserCases());
      } catch (err) {
        console.error('Failed to load appeals:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 pb-6">
      {/* Hero */}
      <section className="rounded-xl border border-hairline bg-canvas px-5 py-8 sm:px-8 sm:py-10">
        <div className="space-y-5 text-center">
          <MarketingEyebrow>new appeal</MarketingEyebrow>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rg-serif text-[clamp(28px,7vw,38px)] text-ink font-bold leading-[1.06] tracking-tight"
          >
            Review a grade with evidence.
          </motion.h1>
          <p className="rg-lead text-[15px] sm:text-[16px] font-medium max-w-sm mx-auto">
            Add the marked paper, rubric, or teacher feedback. Regrade separates what is visible,
            what may need clarification, and what belongs in a respectful draft.
          </p>

          {/* Mini flow graphic */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg min-w-[72px] ${step.color}`}
                >
                  <step.icon className="w-5 h-5" strokeWidth={1.75} />
                  <span className="text-[11px] font-semibold">{step.label}</span>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <ICONS.ChevronRight className="w-3.5 h-3.5 text-ink-muted/50 shrink-0" strokeWidth={2} />
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
