import React from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { PLATFORM_APP_LINKS } from '../lib/platformUploadGuides';
import MarketingEyebrow from './MarketingEyebrow';

type PlatformStatus = 'Supported' | 'Manual upload' | 'Coming soon';

type Platform = {
  id: string;
  name: string;
  /** Brand color for the monogram chip. */
  color: string;
  /** What Regrade reads from this platform's exports. */
  reads: string;
  status: PlatformStatus;
};

const COLLEGE_PLATFORMS: Platform[] = [
  { id: 'canvas', name: 'Canvas', color: '#E4060F', reads: 'Rubrics + comments', status: 'Supported' },
  { id: 'gradescope', name: 'Gradescope', color: '#0095D9', reads: 'Rubrics + comments', status: 'Supported' },
  { id: 'blackboard', name: 'Blackboard', color: '#262626', reads: 'Scores + feedback', status: 'Supported' },
  { id: 'moodle', name: 'Moodle', color: '#F98012', reads: 'Scores + feedback', status: 'Supported' },
  { id: 'd2l', name: 'D2L Brightspace', color: '#D64000', reads: 'Rubrics + feedback', status: 'Supported' },
  { id: 'turnitin', name: 'Turnitin', color: '#0055A4', reads: 'QuickMarks + rubric', status: 'Supported' },
];

const SCHOOL_PLATFORMS: Platform[] = [
  { id: 'classroom', name: 'Google Classroom', color: '#188038', reads: 'Comments + grades', status: 'Supported' },
  { id: 'schoology', name: 'Schoology', color: '#47BBD1', reads: 'Rubrics + feedback', status: 'Supported' },
  { id: 'canvas-hs', name: 'Canvas', color: '#E4060F', reads: 'Rubrics + comments', status: 'Supported' },
  { id: 'powerschool', name: 'PowerSchool', color: '#0066B3', reads: 'Scores + feedback', status: 'Supported' },
  { id: 'paper', name: 'Marked paper', color: '#7C5CFC', reads: 'Handwriting + marks', status: 'Supported' },
];

/** What "Supported" actually means — shown instead of marketing user counts. */
const CAPABILITY_TAGS = ['PDF upload', 'Screenshot upload', 'Rubric detection', 'Comments detected'] as const;

const FLOW_STEPS = [
  { icon: ICONS.Upload, label: 'Upload' },
  { icon: ICONS.Search, label: 'Detect rubric' },
  { icon: ICONS.CheckCircle2, label: 'Find issues' },
  { icon: ICONS.Edit3, label: 'Draft appeal' },
] as const;

const STACK_ROW = [
  { name: 'Canvas', color: '#E4060F' },
  { name: 'Gradescope', color: '#0095D9' },
  { name: 'Classroom', color: '#188038' },
] as const;

function Monogram({ name, color, size = 34 }: { name: string; color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-[10px] font-bold shrink-0"
      style={{
        width: size,
        height: size,
        color,
        backgroundColor: `${color}14`,
        border: `1px solid ${color}26`,
        fontSize: size * 0.44,
      }}
    >
      {name.charAt(0)}
    </span>
  );
}

function StatusPill({ status }: { status: PlatformStatus }) {
  const style =
    status === 'Supported'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      : status === 'Manual upload'
        ? 'bg-primary/8 text-primary border-primary/20'
        : 'bg-ink/5 text-ink-muted border-ink/10';
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style}`}>
      {status}
    </span>
  );
}

const PlatformCard: React.FC<{ platform: Platform; index: number }> = ({ platform, index }) => {
  const href = PLATFORM_APP_LINKS[platform.id];
  const body = (
    <>
      <Monogram name={platform.name} color={platform.color} />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[13.5px] font-semibold text-ink leading-tight truncate">{platform.name}</p>
        <p className="text-[11px] text-ink-muted mt-0.5 truncate">{platform.reads}</p>
      </div>
      <StatusPill status={platform.status} />
    </>
  );
  const cls =
    'rg-glass-chip w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-hairline hover:border-primary/30 transition-all';

  return href ? (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04 }}
      whileTap={{ scale: 0.98 }}
      className={`${cls} no-underline`}
      aria-label={`${platform.name} — ${platform.reads}`}
    >
      {body}
    </motion.a>
  ) : (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04 }}
      className={cls}
    >
      {body}
    </motion.div>
  );
};

export default function SupportedPlatforms({
  compact = false,
  onAddPlatform,
}: {
  compact?: boolean;
  onAddPlatform?: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="text-center space-y-2">
        <MarketingEyebrow>your gradebooks</MarketingEyebrow>
        <h2 className="rg-serif text-[clamp(22px,5vw,28px)] text-ink font-semibold leading-tight">
          Connect where your grades live
        </h2>
        <p className="rg-lead text-[15px] max-w-sm mx-auto">
          Regrade works best when it understands your{' '}
          <strong className="text-ink font-medium">rubric</strong>,{' '}
          <strong className="text-ink font-medium">score</strong>, and{' '}
          <strong className="text-primary font-medium">teacher feedback</strong>.
        </p>
      </div>

      {/* Your grading stack */}
      <div className="rg-glass-form-card p-4 sm:p-5 space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-primary/70">Your grading stack</p>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {STACK_ROW.map((p) => (
            <span key={p.name} className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rg-glass-chip pl-1.5 pr-3 py-1.5 rounded-full">
                <Monogram name={p.name} color={p.color} size={22} />
                <span className="text-[12px] font-semibold text-ink/80">{p.name}</span>
              </span>
              <ICONS.ChevronRight className="w-3.5 h-3.5 text-primary/40" strokeWidth={2.5} aria-hidden />
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white pl-3 pr-3.5 py-1.5 shadow-md shadow-primary/25">
            <ICONS.Zap className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
            <span className="text-[12px] font-bold">Regrade</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {CAPABILITY_TAGS.map((tag) => (
            <span key={tag} className="text-[10.5px] font-medium text-primary bg-primary/6 border border-primary/15 rounded-full px-2.5 py-1">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Grouped platforms */}
      <div className="space-y-2.5">
        <p className="rg-section-title px-1">Common at colleges</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COLLEGE_PLATFORMS.map((p, i) => (
            <PlatformCard key={p.id} platform={p} index={i} />
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="rg-section-title px-1">Common in high school</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SCHOOL_PLATFORMS.map((p, i) => (
            <PlatformCard key={p.id} platform={p} index={i} />
          ))}
        </div>
      </div>

      {/* No login required */}
      <div className="rg-glass-form-card p-5 flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 shrink-0">
          <ICONS.Lock className="w-5 h-5 text-emerald-700" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink leading-tight">No login required</p>
          <p className="text-[13px] text-ink-muted leading-relaxed mt-1">
            Upload a screenshot or PDF from your gradebook. Regrade never asks for your school password.
          </p>
        </div>
      </div>

      {/* Mini flow */}
      {!compact && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          {FLOW_STEPS.map((step, i) => (
            <span key={step.label} className="inline-flex items-center gap-1 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink/75">
                <step.icon className="w-4 h-4 text-primary" strokeWidth={2} aria-hidden />
                {step.label}
              </span>
              {i < FLOW_STEPS.length - 1 && (
                <ICONS.ArrowRight className="w-3.5 h-3.5 text-primary/35" strokeWidth={2.5} aria-hidden />
              )}
            </span>
          ))}
        </div>
      )}

      {onAddPlatform && (
        <button
          type="button"
          onClick={onAddPlatform}
          className="rg-btn-cta w-full py-3.5 text-[15px] flex items-center justify-center gap-2"
        >
          <ICONS.PlusCircle className="w-4.5 h-4.5" strokeWidth={2} />
          Add a platform
        </button>
      )}
    </section>
  );
}
