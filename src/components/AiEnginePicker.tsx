import { motion } from 'motion/react';
import { ICONS } from '../constants';
import type { AiEngine } from '../types';

const OPTIONS = [
  { id: 'hybrid' as const, label: 'Auto', hint: '2.5 + 4.7', icon: ICONS.Zap },
  { id: 'gemini' as const, label: 'Gemini', hint: '2.5 fast', icon: ICONS.Search },
  { id: 'claude' as const, label: 'Claude', hint: 'opus 4.7', icon: ICONS.Lightbulb },
] satisfies { id: AiEngine; label: string; hint: string; icon: typeof ICONS.Zap }[];

export default function AiEnginePicker({
  value,
  onChange,
  disabled,
}: {
  value: AiEngine | null;
  onChange: (engine: AiEngine) => void;
  disabled?: boolean;
  /** @deprecated Always compact — kept for call-site compat */
  compact?: boolean;
}) {
  const current = value ?? 'hybrid';

  return (
    <div className="space-y-2 max-w-md mx-auto w-full">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-primary text-center">
        AI reader
      </p>

      <div
        className="flex rounded-[var(--radius-pill)] border border-hairline bg-parchment p-0.5 gap-0.5"
        role="radiogroup"
        aria-label="AI reader"
      >
        {OPTIONS.map((opt) => {
          const selected = current === opt.id;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              whileTap={{ scale: 0.96 }}
              role="radio"
              aria-checked={selected}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-[var(--radius-pill)] transition-all disabled:opacity-50 ${
                selected
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span className={`text-[11px] font-semibold leading-none ${selected ? 'text-white' : 'text-ink'}`}>
                {opt.label}
              </span>
              <span
                className={`text-[8px] font-mono tracking-wide leading-none ${
                  selected ? 'text-white/70' : 'text-muted'
                }`}
              >
                {opt.hint}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
