import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ICONS } from '../constants';

export default function AnimatedPrimaryButton({
  children,
  onClick,
  className = '',
  showPlus = false,
  disabled = false,
  type = 'button',
  hero = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  showPlus?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  /** Larger, bolder CTA for primary appeal actions */
  hero?: boolean;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`rg-btn-cta group relative overflow-hidden ${hero ? 'rg-btn-cta-hero' : ''} ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <span className="rg-btn-cta-glow" aria-hidden />
      <span className="rg-btn-cta-shine" aria-hidden />
      <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
        {showPlus && (
          <motion.span
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/28 border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-sm"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ICONS.Plus className="w-4 h-4" strokeWidth={2.5} />
          </motion.span>
        )}
        {children}
      </span>
    </motion.button>
  );
}
