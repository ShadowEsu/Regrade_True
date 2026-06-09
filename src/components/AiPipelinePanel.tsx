import React, { useMemo, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import type { AiNotes, SourcePlatform } from '../types';
import { ICONS } from '../constants';
import { AI_TRADEMARK_FOOTER } from '../version';

type PlatformCard = {
  id: SourcePlatform;
  name: string;
  cues: string;
};

const PLATFORMS: PlatformCard[] = [
  { id: 'gradescope', name: 'Gradescope', cues: 'Blue bubbles · rubric panel · score summary' },
  { id: 'canvas', name: 'Canvas', cues: 'SpeedGrader pins · rubric grid · assessment comment' },
  { id: 'moodle', name: 'Moodle', cues: 'Feedback table · rubric levels · annotated PDF' },
  { id: 'blackboard', name: 'Blackboard', cues: 'Inline bubbles · rubric scorecard' },
  { id: 'brightspace', name: 'D2L Brightspace', cues: 'Evaluation panel · achievement rubric' },
  { id: 'google_classroom', name: 'Google Classroom', cues: 'Margin chips · grading panel' },
  { id: 'turnitin', name: 'Turnitin', cues: 'QuickMarks + rubric — not similarity % alone' },
  { id: 'paper', name: 'Marked paper', cues: 'Pen marks · circled scores · margin handwriting' },
  { id: 'schoology', name: 'Schoology', cues: 'Checklist rubric · feedback text' },
  { id: 'teams', name: 'Microsoft Teams', cues: 'Assignment feedback · rubric checklist' },
];

const STAGES = [
  {
    id: 'STG_01',
    title: 'Reader',
    model: 'Gemini 2.5 Flash',
    label: 'Reading the worksheet',
    icon: 'Eye',
    accent: 'from-blue-600/15 via-sky-500/10 to-transparent',
  },
  {
    id: 'STG_02',
    title: 'Reasoner',
    model: 'Opus 4.7',
    label: 'Judging the marking',
    icon: 'Calculator',
    accent: 'from-emerald-600/15 via-green-500/10 to-transparent',
  },
  {
    id: 'STG_03',
    title: 'Cross-check',
    model: 'Verification',
    label: 'Verification',
    icon: 'ShieldCheck',
    accent: 'from-violet-600/15 via-purple-500/10 to-transparent',
  },
] as const;

function iconFor(name: string) {
  const anyIcons = ICONS as unknown as Record<string, React.ComponentType<any>>;
  return anyIcons[name] ?? ICONS.Activity;
}

export default function AiPipelinePanel({
  aiNotes,
  sourcePlatform,
}: {
  aiNotes: AiNotes;
  sourcePlatform?: SourcePlatform;
}) {
  const selectedPlatforms = useMemo(() => {
    // Always show the detected platform first, then the rest.
    if (!sourcePlatform || sourcePlatform === 'unknown' || sourcePlatform === 'mixed') return PLATFORMS;
    const match = PLATFORMS.find((p) => p.id === sourcePlatform);
    if (!match) return PLATFORMS;
    return [match, ...PLATFORMS.filter((p) => p.id !== sourcePlatform)];
  }, [sourcePlatform]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(wrapperRef, { amount: 0.25, once: true });

  const engines =
    aiNotes.engines_used.length > 1 ? 'Two readers reviewed your worksheet' : 'One reader reviewed your worksheet';

  const icons = [iconFor('Eye'), iconFor('Calculator'), iconFor('ShieldCheck')];

  return (
    <section
      ref={wrapperRef}
      className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-primary/10 bg-white/90 shadow-[0_25px_90px_-60px_rgba(0,35,111,0.35)]"
    >
      <div className="absolute inset-0 paper-texture opacity-20 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[44rem] h-[44rem] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-10 md:p-16 space-y-8 sm:space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-primary/40">How the AI reviewed your paper</p>
            <h3 className="font-serif text-4xl sm:text-5xl text-primary font-semibold tracking-tight leading-[1.02]">
              {engines}
            </h3>
            <p className="text-[14px] sm:text-[15px] font-medium text-on-surface-variant/85 leading-relaxed max-w-3xl">
              Scroll through the stages below. Each stage shows what the AI did and what it could not read clearly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-3 py-1 rounded-full bg-primary/5 border border-primary/10 font-semibold text-primary/65">
              {aiNotes.engines_used.includes('gemini') ? 'Integrates with Gemini' : 'Gemini (off)'}
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/5 border border-primary/10 font-semibold text-primary/65">
              {aiNotes.engines_used.includes('claude') ? 'Supports Claude models' : 'Claude (off)'}
            </span>
            {aiNotes.fallback_used && (
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 font-semibold text-amber-800">
                Fallback used
              </span>
            )}
          </div>
        </div>

        {/* Platform cue strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary/45">What it looks for (by platform)</p>
            <p className="hidden sm:block text-[12px] text-primary/45 font-medium">
              Tip: upload the view that shows <span className="font-semibold text-primary/70">scores</span>,{' '}
              <span className="font-semibold text-primary/70">rubric</span>, and <span className="font-semibold text-primary/70">comments</span>.
            </p>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
            <div className="flex gap-4 min-w-max pb-2">
              {selectedPlatforms.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={inView ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: 0.06 * idx, duration: 0.55, ease: 'easeOut' }}
                  className={`w-[min(85vw,20rem)] sm:w-[22rem] shrink-0 rounded-[1.75rem] border p-5 bg-white/85 backdrop-blur-xl shadow-sm ${
                    p.id === sourcePlatform
                      ? 'border-primary/25 ring-1 ring-primary/10'
                      : 'border-primary/10 hover:border-primary/20 transition-colors'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-xl text-primary font-semibold tracking-tight">{p.name}</p>
                      <p className="mt-2 text-[13px] text-on-surface-variant/80 leading-relaxed">{p.cues}</p>
                    </div>
                    {p.id === sourcePlatform && (
                      <span className="shrink-0 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-[0.24em]">
                        Detected
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage stepper + cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 sticky top-28">
            <div className="rounded-[2rem] border border-primary/10 bg-white/90 backdrop-blur-2xl p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 mb-4">Pipeline</p>
              <div className="space-y-4">
                {STAGES.map((s, i) => {
                  const Icon = icons[i] ?? ICONS.Activity;
                  return (
                    <div key={s.id} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/70">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary/50">{s.id}</p>
                        <p className="font-serif text-lg text-primary font-semibold leading-tight">{s.title}</p>
                        <p className="text-[12px] text-on-surface-variant/80 font-medium">{s.model}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {/* STG 01 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`rounded-[2.5rem] border border-primary/10 bg-gradient-to-br ${STAGES[0].accent} p-8 sm:p-10`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/45">
                    {STAGES[0].id} · {STAGES[0].label}
                  </p>
                  <p className="font-serif text-2xl sm:text-3xl text-primary font-semibold tracking-tight">
                    It reads your worksheet like a careful TA
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-primary/60">Model</p>
                  <p className="font-serif text-lg text-primary font-semibold">{STAGES[0].model}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white/70 border border-primary/10 p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/45 mb-2">What it extracted</p>
                  <p className="text-[14px] sm:text-[15px] italic text-primary/85 leading-relaxed">
                    {aiNotes.extraction_summary}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 border border-primary/10 p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/45 mb-2">
                    What was hard to read
                  </p>
                  {aiNotes.extraction_uncertainties.length > 0 ? (
                    <ul className="space-y-2 text-[13px] text-on-surface-variant/85 list-disc list-inside marker:text-primary/40">
                      {aiNotes.extraction_uncertainties.slice(0, 6).map((u, idx) => (
                        <li key={idx} className="leading-snug">
                          {u}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-on-surface-variant/80 leading-relaxed">
                      No low-confidence items were reported.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* STG 02 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.08, duration: 0.6, ease: 'easeOut' }}
              className={`rounded-[2.5rem] border border-primary/10 bg-gradient-to-br ${STAGES[1].accent} p-8 sm:p-10`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/45">
                    {STAGES[1].id} · {STAGES[1].label}
                  </p>
                  <p className="font-serif text-2xl sm:text-3xl text-primary font-semibold tracking-tight">
                    It infers teacher style from rubric + comment patterns
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-primary/60">Model</p>
                  <p className="font-serif text-lg text-primary font-semibold">{STAGES[1].model}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white/70 border border-primary/10 p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/45 mb-2">Summary</p>
                <p className="text-[14px] sm:text-[15px] italic text-primary/85 leading-relaxed">
                  {aiNotes.reasoning_summary}
                </p>
              </div>
            </motion.div>

            {/* STG 03 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.16, duration: 0.6, ease: 'easeOut' }}
              className={`rounded-[2.5rem] border border-primary/10 bg-gradient-to-br ${STAGES[2].accent} p-8 sm:p-10`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/45">
                    {STAGES[2].id} · {STAGES[2].label}
                  </p>
                  <p className="font-serif text-2xl sm:text-3xl text-primary font-semibold tracking-tight">
                    It cross-checks numbers to catch mistakes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-primary/60">Method</p>
                  <p className="font-serif text-lg text-primary font-semibold">{STAGES[2].model}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white/70 border border-primary/10 p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/45 mb-2">Cross-check note</p>
                  <p className="text-[14px] sm:text-[15px] italic text-primary/85 leading-relaxed">
                    {aiNotes.cross_check_summary}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 border border-primary/10 p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/45 mb-2">Disagreements</p>
                  {aiNotes.disagreements.length > 0 ? (
                    <ul className="space-y-2 text-[13px] text-on-surface-variant/85">
                      {aiNotes.disagreements.slice(0, 6).map((d, i) => (
                        <li key={i} className="leading-snug">
                          <span className="font-mono text-[11px] text-primary/70">{d.field}</span> — Gemini:{' '}
                          <span className="font-medium text-primary/85">{d.gemini_said}</span> · Claude:{' '}
                          <span className="font-medium text-primary/85">{d.claude_said}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-on-surface-variant/80 leading-relaxed">
                      No disagreements were reported.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="text-[11px] text-primary/45 leading-relaxed pt-2">
              <span className="opacity-70 italic">
                {AI_TRADEMARK_FOOTER}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

