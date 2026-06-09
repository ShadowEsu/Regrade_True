import { motion } from 'motion/react';
import { ICONS } from '../constants';
import type { AiEngine } from '../types';

const OPTIONS = [
  {
    id: 'hybrid' as const,
    label: 'Auto',
    hint: '2.5 + 4.7',
    icon: ICONS.Zap,
    iconClass: 'rg-ai-engine-icon-auto',
    selectedClass: 'rg-ai-engine-selected-auto',
  },
  {
    id: 'gemini' as const,
    label: 'Gemini',
    hint: '2.5 fast',
    icon: ICONS.Search,
    iconClass: 'rg-ai-engine-icon-gemini',
    selectedClass: 'rg-ai-engine-selected-gemini',
  },
  {
    id: 'claude' as const,
    label: 'Claude',
    hint: 'opus 4.7',
    icon: ICONS.Lightbulb,
    iconClass: 'rg-ai-engine-icon-claude',
    selectedClass: 'rg-ai-engine-selected-claude',
  },
] satisfies {
  id: AiEngine;
  label: string;
  hint: string;
  icon: typeof ICONS.Zap;
  iconClass: string;
  selectedClass: string;
}[];

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
    <div className="space-y-3 max-w-md mx-auto w-full">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/65 text-center">
        AI reader
      </p>

      <div className="rg-ai-reader-panel" role="radiogroup" aria-label="AI reader">
        <div className="flex gap-1.5 sm:gap-2 p-1">
          {OPTIONS.map((opt) => {
            const selected = current === opt.id;
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt.id)}
                role="radio"
                aria-checked={selected}
                whileTap={{ scale: disabled ? 1 : 0.96 }}
                className={`rg-ai-engine-opt flex-1 min-w-0 disabled:opacity-50 ${
                  selected ? opt.selectedClass : 'rg-ai-engine-opt-idle'
                }`}
              >
                <span
                  className={`rg-ai-engine-icon ${opt.iconClass} ${selected ? 'rg-ai-engine-icon-on' : ''}`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
                </span>

                <span
                  className={`relative z-10 text-[13px] sm:text-[14px] font-bold leading-none tracking-tight ${
                    selected ? 'text-white' : 'text-ink'
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`relative z-10 text-[9px] sm:text-[10px] font-semibold tracking-wide leading-none ${
                    selected ? 'text-white/85' : 'text-ink-muted'
                  }`}
                >
                  {opt.hint}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
