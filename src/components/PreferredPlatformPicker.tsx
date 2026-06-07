import { motion } from 'motion/react';
import {
  PLATFORM_UPLOAD_GUIDES,
  type PlatformGuideId,
} from '../lib/platformUploadGuides';

export default function PreferredPlatformPicker({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: PlatformGuideId | null;
  onChange: (id: PlatformGuideId) => void;
  disabled?: boolean;
  /** Tighter layout for profile page */
  compact?: boolean;
}) {
  const current = value ?? 'gradescope';

  return (
    <div
      className={`flex flex-wrap gap-2 ${compact ? 'justify-start' : 'justify-center'}`}
      role="radiogroup"
      aria-label="Preferred grading platform"
    >
      {PLATFORM_UPLOAD_GUIDES.map((p) => {
        const selected = current === p.id;
        return (
          <motion.button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p.id)}
            whileTap={{ scale: 0.96 }}
            role="radio"
            aria-checked={selected}
            className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-[11px] font-semibold transition-all border shrink-0 disabled:opacity-50 ${
              selected
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-canvas text-ink-muted border-hairline hover:border-primary/30'
            }`}
            style={!selected && p.color ? { color: p.color } : undefined}
          >
            {p.logo && (
              <img src={p.logo} alt="" className="h-3 w-auto object-contain" draggable={false} />
            )}
            {p.name}
          </motion.button>
        );
      })}
    </div>
  );
}
