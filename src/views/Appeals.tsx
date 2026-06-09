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

const PLATFORM_LOGOS = [
  { src: '/platforms/canvas.png', alt: 'Canvas' },
  { src: '/platforms/d2l.png', alt: 'Brightspace' },
  { src: '/platforms/google-classroom.png', alt: 'Classroom' },
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
    <div className="space-y-10 pb-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[20px] border border-primary/10 bg-gradient-to-br from-primary/[0.07] via-canvas to-violet-500/[0.06] px-5 py-8 sm:px-7 sm:py-10">
        <div
          className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-violet-400/10 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div className="relative space-y-5 text-center">
          <MarketingEyebrow>new appeal</MarketingEyebrow>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rg-serif text-[clamp(28px,7vw,36px)] text-ink font-semibold leading-[1.08] tracking-tight"
          >
            Start a new appeal.
          </motion.h1>
          <p className="rg-lead text-[15px] max-w-sm mx-auto">
            Upload graded work from Canvas, Gradescope, or any LMS — we read the rubric and draft
            your email.
          </p>

          {/* Mini flow graphic */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl min-w-[72px] ${step.color}`}
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

          <AnimatedPrimaryButton onClick={onStartNew} showPlus className="max-w-xs mx-auto">
            Start new appeal
          </AnimatedPrimaryButton>
        </div>
      </section>

      {/* Upload preview card */}
      <motion.button
        type="button"
        onClick={onStartNew}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="w-full text-left rg-card overflow-hidden border-2 border-dashed border-primary/25 hover:border-primary/40 transition-colors"
      >
        <div className="p-5 sm:p-6 flex gap-4 items-center">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/15">
            <ICONS.Upload className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="rg-serif text-[15px] font-semibold text-ink">Drop your graded file here</p>
            <p className="text-sm text-ink-muted mt-0.5">PDF, photo, or screenshot — rubric must be visible</p>
            <div className="flex items-center gap-2 mt-3">
              {PLATFORM_LOGOS.map((p) => (
                <img
                  key={p.alt}
                  src={p.src}
                  alt={p.alt}
                  className="h-5 w-auto object-contain opacity-80"
                  draggable={false}
                />
              ))}
              <span className="text-[11px] text-ink-muted font-medium">+ more</span>
            </div>
          </div>
          <ICONS.ArrowRight className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
        </div>
      </motion.button>

      {/* Feature tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: ICONS.Shield, label: 'Rubric scan', tint: 'text-primary bg-primary/8' },
          { icon: ICONS.MessageSquare, label: 'Tone check', tint: 'text-violet-700 bg-violet-500/10' },
          { icon: ICONS.Send, label: 'Email draft', tint: 'text-emerald-700 bg-emerald-500/10' },
        ].map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            whileHover={{ y: -4, scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="rg-glass-card p-3 text-center space-y-2 cursor-default"
          >
            <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center ${tile.tint}`}>
              <tile.icon className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <p className="text-[11px] font-semibold text-ink leading-tight">{tile.label}</p>
          </motion.div>
        ))}
      </div>

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
