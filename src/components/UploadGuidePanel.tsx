import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import MarketingEyebrow from './MarketingEyebrow';
import {
  PLATFORM_UPLOAD_GUIDES,
  type PlatformGuideId,
} from '../lib/platformUploadGuides';

const UPLOAD_STEPS = [
  {
    num: '01',
    title: 'Get the Graded File',
    body: 'Export or download the version your school marked — not the blank original.',
    icon: ICONS.Download,
  },
  {
    num: '02',
    title: 'Comments Must Show',
    body: 'Scores, rubric lines, and teacher feedback need to be visible in the file.',
    icon: ICONS.MessageSquare,
  },
  {
    num: '03',
    title: 'Upload & Analyze',
    body: 'One PDF or a few clear photos. Optional notes only if something is cut off.',
    icon: ICONS.Upload,
  },
] as const;

type UploadGuidePanelProps = {
  /** Controlled selection for this appeal (user can override profile default). */
  selectedPlatformId?: PlatformGuideId;
  onPlatformChange?: (id: PlatformGuideId) => void;
  /** Saved in Profile — shows a hint when the appeal matches it. */
  profileDefaultPlatformId?: PlatformGuideId;
};

export default function UploadGuidePanel({
  selectedPlatformId,
  onPlatformChange,
  profileDefaultPlatformId,
}: UploadGuidePanelProps = {}) {
  const [internalSelected, setInternalSelected] = useState<PlatformGuideId>(
    profileDefaultPlatformId ?? 'gradescope',
  );
  const [platformSearch, setPlatformSearch] = useState('');

  const selected = selectedPlatformId ?? internalSelected;
  const setSelected = onPlatformChange ?? setInternalSelected;

  useEffect(() => {
    if (selectedPlatformId !== undefined) return;
    if (profileDefaultPlatformId) {
      setInternalSelected(profileDefaultPlatformId);
    }
  }, [profileDefaultPlatformId, selectedPlatformId]);

  const filteredPlatforms = useMemo(() => {
    const q = platformSearch.trim().toLowerCase();
    if (!q) return PLATFORM_UPLOAD_GUIDES;
    return PLATFORM_UPLOAD_GUIDES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short.toLowerCase().includes(q) ||
        p.id.replace(/_/g, ' ').includes(q) ||
        p.fileLabel.toLowerCase().includes(q),
    );
  }, [platformSearch]);

  const active =
    filteredPlatforms.find((p) => p.id === selected) ??
    filteredPlatforms[0] ??
    PLATFORM_UPLOAD_GUIDES[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8 text-center"
      aria-labelledby="upload-guide-title"
    >
      <header className="space-y-3 max-w-lg mx-auto">
        <MarketingEyebrow>before you upload</MarketingEyebrow>
        <h2
          id="upload-guide-title"
          className="rg-serif text-[clamp(24px,5.5vw,32px)] text-ink font-semibold leading-tight"
        >
          What to send so the AI reads everything
        </h2>
        <p className="text-[15px] text-ink-muted leading-relaxed max-w-md mx-auto">
          Regrade looks for <strong className="font-medium text-ink">scores</strong>,{' '}
          <strong className="font-medium text-ink">rubric lines</strong>, and{' '}
          <strong className="font-medium text-primary">every teacher comment</strong> — then explains what to fix or appeal.
        </p>
      </header>

      <ol className="grid grid-cols-1 gap-4 text-left max-w-lg mx-auto">
        {UPLOAD_STEPS.map((step, i) => (
          <motion.li
            key={step.num}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            className="flex gap-4 rounded-[var(--radius-card)] border border-hairline bg-canvas p-5"
          >
            <div className="shrink-0 flex flex-col items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">{step.num}</span>
              <div className="p-2.5 rounded-xl bg-primary/8 text-primary">
                <step.icon size={20} strokeWidth={1.75} />
              </div>
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[17px] text-ink font-semibold leading-snug">{step.title}</p>
              <p className="text-[13px] text-ink-muted leading-relaxed mt-1">{step.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>

      <div className="space-y-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
            Pick your platform ({PLATFORM_UPLOAD_GUIDES.length} supported)
          </p>
          {profileDefaultPlatformId && selected === profileDefaultPlatformId ? (
            <p className="text-[10px] text-muted">Your default from Profile — change anytime below</p>
          ) : profileDefaultPlatformId ? (
            <p className="text-[10px] text-muted">Override your Profile default for this appeal</p>
          ) : null}
        </div>

        <div className="relative max-w-xs mx-auto">
          <ICONS.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none"
            strokeWidth={2}
          />
          <input
            type="search"
            value={platformSearch}
            onChange={(e) => {
              const next = e.target.value;
              setPlatformSearch(next);
              const q = next.trim().toLowerCase();
              if (!q) return;
              const match = PLATFORM_UPLOAD_GUIDES.find(
                (p) =>
                  p.name.toLowerCase().includes(q) ||
                  p.short.toLowerCase().includes(q) ||
                  p.id.replace(/_/g, ' ').includes(q),
              );
              if (match) setSelected(match.id);
            }}
            placeholder="Search platforms…"
            aria-label="Search platforms"
            className="w-full pl-9 pr-8 py-2 text-[13px] rounded-[var(--radius-pill)] border border-hairline bg-canvas text-ink placeholder:text-muted outline-none focus:border-primary/40 transition-colors"
          />
          {platformSearch && (
            <button
              type="button"
              onClick={() => setPlatformSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <ICONS.X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="-mx-2 px-2 overflow-x-auto scrollbar-none">
          <div className="flex flex-wrap justify-center gap-2 min-w-max max-w-full pb-1">
            {filteredPlatforms.length === 0 ? (
              <p className="text-[12px] text-muted py-2 w-full text-center">No match — try Canvas, Gradescope, Moodle…</p>
            ) : null}
            {filteredPlatforms.map((p) => {
              const isActive = p.id === selected;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  whileTap={{ scale: 0.96 }}
                  className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-3.5 py-2 text-[11px] font-semibold transition-all border shrink-0 ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-canvas text-ink-muted border-hairline hover:border-primary/30'
                  }`}
                  style={!isActive && p.color ? { color: p.color } : undefined}
                >
                  {p.logo && (
                    <img src={p.logo} alt="" className="h-3.5 w-auto object-contain" draggable={false} />
                  )}
                  {p.name}
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="rounded-[var(--radius-card)] border border-hairline bg-parchment p-6 space-y-5 text-left"
          >
            <div className="text-center space-y-2">
              {active.logo ? (
                <img
                  src={active.logo}
                  alt={active.name}
                  className="h-8 mx-auto object-contain"
                  draggable={false}
                />
              ) : (
                <p
                  className="text-xl font-bold"
                  style={{ color: active.color ?? '#1d1d1f' }}
                >
                  {active.name}
                </p>
              )}
              <h3 className="rg-serif text-xl text-ink font-semibold">{active.fileLabel}</h3>
              <p className="text-[12px] text-muted font-mono">{active.short}</p>
            </div>

            <div className="rounded-xl bg-primary/[0.06] border border-primary/15 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Where comments live</p>
              <p className="text-[13px] text-ink leading-relaxed">{active.whereToLook}</p>
            </div>

            <ol className="space-y-3">
              {active.steps.map((line, idx) => (
                <li key={idx} className="flex gap-3 text-[14px] leading-relaxed text-ink">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>

            <div className="grid grid-cols-1 gap-3 pt-2 border-t border-hairline">
              <div className="rounded-xl bg-canvas border border-hairline px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <ICONS.CheckCircle2 size={14} className="text-primary" />
                  Include in your file
                </p>
                <ul className="space-y-1">
                  {active.mustInclude.map((item) => (
                    <li key={item} className="text-[12px] text-ink flex gap-2">
                      <span className="text-primary shrink-0">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-red-500/[0.04] border border-red-500/15 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-red-700/70 mb-1 flex items-center gap-1.5">
                  <ICONS.AlertCircle size={14} />
                  Skip this
                </p>
                <p className="text-[12px] text-red-900/70 leading-snug">{active.avoid}</p>
              </div>
            </div>

            {active.tip && (
              <p className="text-[11px] text-muted italic border-t border-hairline pt-3 leading-relaxed">
                {active.tip}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-muted italic border-t border-hairline pt-5 max-w-md mx-auto">
        PDF and PNG/JPG work · Word → save as PDF first · Then use the upload box below
      </p>
    </motion.section>
  );
}
