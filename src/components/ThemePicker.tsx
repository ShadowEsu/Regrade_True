import { motion } from 'motion/react';
import { ICONS } from '../constants';
import type { ThemePreference } from '../lib/theme';

const OPTIONS = [
  { id: 'light' as const, label: 'Light', hint: 'day', icon: ICONS.Sun },
  { id: 'dark' as const, label: 'Dark', hint: 'terminal', icon: ICONS.Moon },
  { id: 'system' as const, label: 'System', hint: 'auto', icon: ICONS.Monitor },
] satisfies {
  id: ThemePreference;
  label: string;
  hint: string;
  icon: typeof ICONS.Sun;
}[];

export default function ThemePicker({
  value,
  onChange,
  disabled,
}: {
  value: ThemePreference;
  onChange: (next: ThemePreference) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary">Appearance</p>
          <p className="text-[13px] text-ink-muted mt-1 leading-relaxed">
            Light, dark, or match your device. You can also tap the moon/sun icon in the top bar.
          </p>
        </div>
        <span className="rg-theme-badge shrink-0">{value}</span>
      </div>

      <div className="rg-theme-picker" role="radiogroup" aria-label="Color theme">
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={disabled}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`rg-theme-option ${selected ? 'rg-theme-option-active' : ''}`}
            >
              <span className="rg-theme-option-icon">
                <Icon className="w-4 h-4" strokeWidth={2} />
              </span>
              <span className="block text-[13px] font-semibold text-ink">{opt.label}</span>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mt-0.5">
                {opt.hint}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
