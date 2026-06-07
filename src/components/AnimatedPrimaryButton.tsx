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
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  showPlus?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      className={`rg-btn-cta group relative overflow-hidden ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <span className="rg-btn-cta-shine" aria-hidden />
      <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
        {showPlus && (
          <motion.span
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20"
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
