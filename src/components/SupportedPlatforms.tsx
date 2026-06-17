import { motion } from 'motion/react';
import { ICONS } from '../constants';
import { PLATFORM_APP_LINKS } from '../lib/platformUploadGuides';
import MarketingEyebrow from './MarketingEyebrow';

type LogoPlatform = {
  kind: 'logo';
  id: string;
  name: string;
  src: string;
  height?: number;
  users: string;
};

type TextPlatform = {
  kind: 'text';
  id: string;
  name: string;
  color: string;
  fontWeight?: number;
  letterSpacing?: string;
  users: string;
};

/** Publicly reported user/student figures (approximate; sources linked in footnote). */
const LOGO_PLATFORMS: LogoPlatform[] = [
  { kind: 'logo', id: 'canvas', name: 'Canvas', src: '/platforms/canvas.png', height: 32, users: '30M+ users' },
  { kind: 'logo', id: 'instructure', name: 'Instructure', src: '/platforms/instructure.png', height: 26, users: '30M+ users' },
  { kind: 'logo', id: 'impact', name: 'Impact', src: '/platforms/impact.png', height: 32, users: '8K+ institutions' },
  { kind: 'logo', id: 'mastery', name: 'Mastery', src: '/platforms/mastery.png', height: 32, users: '21M+ students' },
  { kind: 'logo', id: 'd2l', name: 'D2L Brightspace', src: '/platforms/d2l.png', height: 30, users: '20M+ users' },
  { kind: 'logo', id: 'classroom', name: 'Google Classroom', src: '/platforms/google-classroom.png', height: 32, users: '150M+ users' },
];

const TEXT_PLATFORMS: TextPlatform[] = [
  { kind: 'text', id: 'gradescope', name: 'Gradescope', color: '#0095D9', fontWeight: 700, letterSpacing: '-0.02em', users: '3.2M+ students' },
  { kind: 'text', id: 'turnitin', name: 'Turnitin', color: '#0055A4', fontWeight: 700, letterSpacing: '-0.01em', users: '71M students' },
  { kind: 'text', id: 'blackboard', name: 'Blackboard', color: '#262626', fontWeight: 700, users: '150M+ users' },
  { kind: 'text', id: 'moodle', name: 'Moodle', color: '#F98012', fontWeight: 700, letterSpacing: '-0.02em', users: '500M+ accounts' },
  { kind: 'text', id: 'schoology', name: 'Schoology', color: '#47BBD1', fontWeight: 700, users: 'Millions daily' },
  { kind: 'text', id: 'powerschool', name: 'PowerSchool', color: '#0066B3', fontWeight: 700, letterSpacing: '-0.01em', users: '55M+ students' },
  { kind: 'text', id: 'sakai', name: 'Sakai', color: '#6B4C9A', fontWeight: 600, letterSpacing: '0.01em', users: 'Millions worldwide' },
];

const CAPABILITIES = [
  { stat: '12+', label: 'platforms', detail: 'LMS & gradebook formats' },
  { stat: '60s', label: 'to first draft', detail: 'from one photo or PDF' },
  { stat: 'Any', label: 'graded file', detail: 'PDF, screenshot, or scan' },
] as const;

const LOGO_BOX_HEIGHT = 42;
const TEXT_SIZE = 19;

export default function SupportedPlatforms({ compact = false }: { compact?: boolean }) {
  const allItems = [...LOGO_PLATFORMS, ...TEXT_PLATFORMS];

  return (
    <section className={compact ? 'space-y-4' : 'space-y-6'}>
      {!compact && (
        <div className="grid grid-cols-3 gap-2">
          {CAPABILITIES.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rg-glass-stat text-center px-2 py-3"
            >
              <p className="rg-serif text-2xl text-ink font-semibold">{c.stat}</p>
              <p className="text-[11px] font-semibold text-ink mt-0.5">{c.label}</p>
              <p className="text-[10px] text-muted leading-snug mt-0.5">{c.detail}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-center space-y-2">
        <MarketingEyebrow>platforms we read</MarketingEyebrow>
        <h2 className="rg-serif text-[clamp(22px,5vw,28px)] text-ink font-semibold leading-tight">
          Built for the gradebooks you already use
        </h2>
        <p className="rg-lead text-[15px] max-w-sm mx-auto">
          Regrade reads <strong className="text-ink font-medium">scores</strong>,{' '}
          <strong className="text-ink font-medium">rubric lines</strong>, and{' '}
          <strong className="text-primary font-medium">every teacher comment</strong> — then drafts your appeal.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {allItems.map((item, i) => {
          const href = PLATFORM_APP_LINKS[item.id];
          const inner = (
            <>
              <div
                className="flex items-center justify-center w-full px-2"
                style={{ height: LOGO_BOX_HEIGHT }}
              >
                {item.kind === 'logo' ? (
                  <img
                    src={item.src}
                    alt={item.name}
                    className="rg-platform-logo-img w-auto max-w-[90%] object-contain"
                    style={{ height: item.height ?? LOGO_BOX_HEIGHT }}
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <span
                    className="leading-none"
                    style={{
                      color: item.color,
                      fontWeight: item.fontWeight ?? 700,
                      fontSize: TEXT_SIZE,
                      letterSpacing: item.letterSpacing ?? '-0.02em',
                    }}
                  >
                    {item.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-primary/80 tracking-wide">{item.users}</p>
              {href && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary/60 group-hover:text-primary transition-colors">
                  Open
                  <ICONS.ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                </span>
              )}
            </>
          );

          return href ? (
            <motion.a
              key={item.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rg-platform-tile group flex flex-col items-center justify-center text-center gap-2 cursor-pointer no-underline"
              aria-label={`Open ${item.name}`}
            >
              {inner}
            </motion.a>
          ) : (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="rg-platform-tile flex flex-col items-center justify-center text-center gap-2 cursor-default"
            >
              {inner}
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-muted leading-relaxed max-w-sm mx-auto">
        Public estimates from vendor reports &amp; industry data (2024–25). Counts may include students, educators, or registered accounts.
      </p>
    </section>
  );
}
