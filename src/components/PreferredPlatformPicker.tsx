import { motion } from 'motion/react';
import { ICONS } from '../constants';
import {
  PLATFORM_UPLOAD_GUIDES,
  type PlatformGuideId,
} from '../lib/platformUploadGuides';

export default function PreferredPlatformPicker({
  value,
  onChange,
  disabled,
}: {
  value: PlatformGuideId | null;
  onChange: (id: PlatformGuideId) => void;
  disabled?: boolean;
  /** @deprecated layout is always spacious now */
  compact?: boolean;
}) {
  const current = value ?? 'gradescope';

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 text-center sm:text-left">
        <h3 className="rg-serif text-[clamp(18px,4vw,22px)] text-ink font-bold">Pick an option</h3>
        <p className="text-[14px] font-medium text-ink/75 leading-relaxed">
          Tap the app where your professor posts grades. You can change this on any appeal.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Preferred grading platform">
        {PLATFORM_UPLOAD_GUIDES.map((p) => {
          const selected = current === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.id)}
              whileTap={{ scale: 0.97 }}
              role="radio"
              aria-checked={selected}
              className={`rg-platform-pick-tile disabled:opacity-50 ${
                selected ? 'rg-platform-pick-tile-selected' : ''
              }`}
            >
              {selected && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                  <ICONS.Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}

              <div className="flex items-center justify-center h-9 w-full px-1">
                {p.logo ? (
                  <img
                    src={p.logo}
                    alt=""
                    className="h-7 w-auto max-w-[85%] object-contain"
                    draggable={false}
                  />
                ) : (
                  <span
                    className="text-[17px] font-bold leading-none"
                    style={{ color: p.color ?? 'var(--color-ink)' }}
                  >
                    {p.name}
                  </span>
                )}
              </div>

              {p.logo && (
                <span
                  className="text-[13px] font-bold leading-tight"
                  style={{ color: selected ? 'var(--color-primary)' : p.color ?? 'var(--color-ink-muted)' }}
                >
                  {p.name}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
